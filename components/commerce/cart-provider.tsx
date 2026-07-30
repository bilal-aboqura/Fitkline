"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ProductSizeId } from "@/data/products";

export type CartItem = {
  readonly key: string;
  readonly slug: string;
  readonly name: string;
  readonly sizeId: ProductSizeId;
  readonly sizeLabel: string;
  readonly unitPrice?: number | null;
  quantity: number;
  readonly image: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (item: Omit<CartItem, "key" | "quantity">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fitkline-cart";
const EMPTY_SNAPSHOT = "[]";
const AVAILABLE_SIZE_IDS: ReadonlySet<string> = new Set(["4kg", "20kg"]);
let cachedSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  const next = window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  if (next !== cachedSnapshot) cachedSnapshot = next;
  return cachedSnapshot;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readItems(snapshot = getSnapshot()) {
  try {
    const items = JSON.parse(snapshot) as CartItem[];
    return Array.isArray(items)
      ? items.filter((item) => AVAILABLE_SIZE_IDS.has(item.sizeId))
      : [];
  } catch {
    return [];
  }
}

function commitItems(items: CartItem[]) {
  const next = JSON.stringify(items);
  cachedSnapshot = next;
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => readItems(snapshot), [snapshot]);

  const addItem = (item: Omit<CartItem, "key" | "quantity">) => {
    const key = `${item.slug}-${item.sizeId}`;
    const current = readItems();
    const existing = current.find((entry) => entry.key === key);
    commitItems(existing ? current.map((entry) => entry.key === key ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, key, quantity: 1 }]);
  };

  const updateQuantity = (key: string, quantity: number) => {
    commitItems(readItems().map((entry) => entry.key === key ? { ...entry, quantity: Math.max(1, quantity) } : entry));
  };

  const removeItem = (key: string) => commitItems(readItems().filter((entry) => entry.key !== key));
  const clearCart = () => commitItems([]);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
