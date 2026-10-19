import test from "node:test";
import assert from "node:assert/strict";
import { getProductPrice, validateProductDiscount, products, type Product, type ProductSize } from "@/data/products";
import { normalizeOffer, type StoreOffer } from "@/data/offers";
import { getCartSubtotal, getLinePrice, getValidBundleOffers, repriceCartItems } from "@/lib/cart-pricing";
import type { CartItem } from "@/components/commerce/cart-provider";

const size: ProductSize = { id: "4kg", label: "4 كجم", price: 100, discountPercent: 20, active: true, stock: null };
const product: Product = { ...products[1], sizes: [size, { ...size, id: "20kg", price: 500, discountPercent: 0 }] };
const cart: CartItem = { key: "shinyfit-4kg-standard", slug: "shinyfit", name: "SHINYFIT", sizeId: "4kg", sizeLabel: "4 كجم", quantity: 1, unitPrice: 1, image: product.image };
const offer: StoreOffer = normalizeOffer({ id: "bundle", title: "باقة", status: "active", discountPercent: 10, items: [{ slug: "shinyfit", sizeId: "4kg", quantity: 2 }] });

test("product discounts are per size, optional on existing products, and rounded to piastres", () => {
  assert.equal(getProductPrice(size), 80);
  assert.equal(getProductPrice({ price: 495, discountPercent: 12.5 }), 433.13);
  assert.equal(getProductPrice({ price: 100 }), 100);
  assert.equal(getProductPrice({ price: null }), null);
  assert.equal(getProductPrice({ price: 100, discountPercent: 100 }), 0);
  assert.equal(getProductPrice(product.sizes[1]), 500);
});
test("invalid discounts and discounts without a valid base price are rejected", () => {
  for (const discountPercent of [-1, 101, NaN, Infinity, "10" as unknown as number]) {
    assert.throws(() => validateProductDiscount({ price: 100, discountPercent }));
  }
  assert.throws(() => validateProductDiscount({ price: null, discountPercent: 10 }));
  assert.throws(() => validateProductDiscount({ price: 0, discountPercent: 10 }));
  assert.doesNotThrow(() => validateProductDiscount({ price: null }));
});
test("saved carts are repriced from current catalog and reset when a product sale ends", () => {
  assert.equal(repriceCartItems([cart], [product], [])[0].unitPrice, 80);
  assert.equal(repriceCartItems([{ ...cart, unitPrice: 9999 }], [product], [])[0].listUnitPrice, 100);
  const ended = { ...product, sizes: [{ ...size, discountPercent: 0 }] };
  assert.equal(repriceCartItems([{ ...cart, unitPrice: 80 }], [ended], [])[0].unitPrice, 100);
  assert.equal(repriceCartItems([cart], [{ ...product, active: false }], [])[0].unitPrice, null);
});
test("exact bundles use their own price without stacking individual product discounts", () => {
  const bundleItem = { ...cart, offerId: "bundle", quantity: 2 };
  const valid = getValidBundleOffers([bundleItem], [offer], [product]);
  assert.equal(getLinePrice(size, 2, valid.get("bundle")), 90);
  assert.equal(repriceCartItems([bundleItem], [product], [offer])[0].unitPrice, 90);
  const fixed = { ...offer, offerPrice: 150 };
  const fixedPricing = getValidBundleOffers([bundleItem], [fixed], [product]).get("bundle");
  assert.equal(getLinePrice(size, 2, fixedPricing), 75);
  assert.equal(repriceCartItems([bundleItem], [product], [fixed])[0].unitPrice, 75);
});
test("expired or edited bundles fall back to the current product sale on both sides", () => {
  const changedQuantity = { ...cart, offerId: "bundle", quantity: 1 };
  assert.equal(getValidBundleOffers([changedQuantity], [offer], [product]).size, 0);
  const expired = { ...offer, endAt: "2020-01-01T00:00:00Z" };
  const bundled = { ...cart, offerId: "bundle", quantity: 2 };
  const repriced = repriceCartItems([bundled], [product], [expired])[0];
  assert.equal(repriced.unitPrice, 80);
  assert.equal(repriced.offerUnavailable, true);
});
test("fixed bundle allocation stays identical for multiple quantities", () => {
  const bundled = { ...cart, offerId: "bundle", quantity: 3 };
  const fixed = { ...offer, items: [{ ...offer.items[0], quantity: 3 }], offerPrice: 19.99 };
  const valid = getValidBundleOffers([bundled], [fixed], [product]);
  const serverPrice = getLinePrice(size, 3, valid.get("bundle"));
  const clientPrice = repriceCartItems([bundled], [product], [fixed])[0].unitPrice;
  assert.equal(serverPrice, clientPrice);
  assert.ok(Math.abs(serverPrice! * 3 - 19.99) < 0.005);
});

test("campaign totals preserve per-unit rounding after a fractional fixed bundle allocation", () => {
  const bundled = { ...cart, offerId: "bundle", quantity: 3 };
  const fixed = { ...offer, items: [{ ...offer.items[0], quantity: 3 }], offerPrice: 19.99 };
  const lines = repriceCartItems([bundled], [product], [fixed]);
  const campaignPrice = (price: number) => Math.round(price * 0.9 * 100) / 100;
  const finalSubtotal = getCartSubtotal(lines, campaignPrice);
  assert.equal(finalSubtotal, 18);
  const savings = getCartSubtotal(lines)! - finalSubtotal!;
  assert.ok(Math.abs(savings - 1.99) < 0.00001);
  const serverUnit = getLinePrice(size, 3, getValidBundleOffers([bundled], [fixed], [product]).get("bundle"))!;
  assert.equal(finalSubtotal, campaignPrice(serverUnit) * 3);
  assert.equal(getCartSubtotal([{ unitPrice: null, quantity: 1 }], campaignPrice), null);
});
