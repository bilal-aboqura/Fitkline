import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import type { Product } from "@/data/products";

export type SiteSettings = {
  siteName: string;
  logoUrl: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  shippingNote: string;
  currency: "EGP";
  kashierEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
};

export type HomeContent = {
  heroScenes: Array<{
    label: string;
    title: string;
    accent: string;
    description: string;
  }>;
  system: {
    kicker: string;
    title: string;
    accent: string;
    description: string;
  };
  directory: {
    kicker: string;
    title: string;
    accent: string;
    lead: string;
  };
  benefits: {
    kicker: string;
    title: string;
    accent: string;
    description: string;
  };
  quote: {
    kicker: string;
    title: string;
    accent: string;
    description: string;
  };
};

export type PagesContent = {
  about: {
    heroTitle: string;
    heroAccent: string;
    heroDescription: string;
    kicker: string;
    sectionTitle: string;
    paragraphs: string[];
    ctaLabel: string;
    principles: Array<{ title: string; description: string }>;
  };
  faq: {
    heroTitle: string;
    heroAccent: string;
    heroDescription: string;
    items: Array<{ question: string; answer: string }>;
  };
  contact: {
    heroTitle: string;
    heroAccent: string;
    heroDescription: string;
    kicker: string;
    sectionTitle: string;
    intro: string;
    notes: string[];
    form: {
      nameLabel: string;
      phoneLabel: string;
      facilityLabel: string;
      facilityTypeLabel: string;
      facilityTypePlaceholder: string;
      facilityTypeOptions: Array<{ value: string; label: string }>;
      governorateLabel: string;
      areaLabel: string;
      areaPlaceholder: string;
      messageLabel: string;
      submitLabel: string;
      successTitle: string;
      successDescription: string;
      errorMessage: string;
    };
  };
  privacy: {
    kicker: string;
    title: string;
    sections: Array<{ title: string; body: string }>;
  };
  terms: {
    kicker: string;
    title: string;
    sections: Array<{ title: string; body: string }>;
  };
};

export type CmsContent = {
  revision: number;
  updatedAt: string;
  settings: SiteSettings;
  navigation: Array<{ href: string; label: string }>;
  home: HomeContent;
  pages: PagesContent;
  products: Product[];
};

const contentPath = path.join(process.cwd(), "data", "cms-content.json");
const allowedSizeIds = new Set(["4kg", "20kg"]);

function assertText(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`${field} must be text`);
  }
}

function assertBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be true or false`);
  }
}

export function validateCmsContent(value: unknown): asserts value is CmsContent {
  if (!value || typeof value !== "object") throw new Error("Invalid content document");
  const content = value as Partial<CmsContent>;
  if (!content.settings || !content.home || !content.pages || !Array.isArray(content.products)) {
    throw new Error("Content settings, home, pages, and products are required");
  }

  assertText(content.settings.siteName, "settings.siteName");
  assertText(content.settings.logoUrl, "settings.logoUrl");
  assertText(content.settings.tagline, "settings.tagline");
  assertText(content.settings.phone, "settings.phone");
  assertText(content.settings.whatsapp, "settings.whatsapp");
  assertText(content.settings.email, "settings.email");
  assertText(content.settings.address, "settings.address");
  assertText(content.settings.shippingNote, "settings.shippingNote");
  assertBoolean(
    content.settings.kashierEnabled,
    "settings.kashierEnabled",
  );
  assertBoolean(
    content.settings.cashOnDeliveryEnabled,
    "settings.cashOnDeliveryEnabled",
  );
  if (!Array.isArray(content.navigation)) throw new Error("navigation must be a list");
  for (const item of content.navigation) {
    assertText(item.href, "navigation.href");
    assertText(item.label, "navigation.label");
    if (!item.href.startsWith("/")) {
      throw new Error("Navigation links must start with /");
    }
  }

  if (!Array.isArray(content.home.heroScenes) || !content.home.heroScenes.length) {
    throw new Error("At least one hero scene is required");
  }
  for (const [index, scene] of content.home.heroScenes.entries()) {
    assertText(scene.label, `home.heroScenes.${index}.label`);
    assertText(scene.title, `home.heroScenes.${index}.title`);
    assertText(scene.accent, `home.heroScenes.${index}.accent`);
    assertText(scene.description, `home.heroScenes.${index}.description`);
  }
  for (const section of ["system", "directory", "benefits", "quote"] as const) {
    for (const [field, sectionValue] of Object.entries(content.home[section])) {
      assertText(sectionValue, `home.${section}.${field}`);
    }
  }

  const validateTextTree = (node: unknown, field: string): void => {
    if (typeof node === "string") return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => validateTextTree(item, `${field}.${index}`));
      return;
    }
    if (node && typeof node === "object") {
      Object.entries(node).forEach(([key, item]) =>
        validateTextTree(item, `${field}.${key}`),
      );
      return;
    }
    throw new Error(`${field} must contain text fields only`);
  };
  validateTextTree(content.pages, "pages");

  const productSlugs = new Set<string>();
  for (const product of content.products) {
    assertText(product.slug, "product.slug");
    assertText(product.name, "product.name");
    assertText(product.image, `${product.name}.image`);
    assertText(product.imageAlt, `${product.name}.imageAlt`);
    assertBoolean(product.active, `${product.name}.active`);
    if (!/^[a-z0-9-]+$/.test(product.slug)) {
      throw new Error("Product page links may contain lowercase letters, numbers, and hyphens only");
    }
    if (productSlugs.has(product.slug)) {
      throw new Error(`Duplicate product link: ${product.slug}`);
    }
    productSlugs.add(product.slug);
    if (!Array.isArray(product.sizes) || !product.sizes.length) {
      throw new Error(`${product.name} needs at least one size`);
    }
    for (const size of product.sizes) {
      if (!allowedSizeIds.has(size.id)) {
        throw new Error("Only 4kg and 20kg sizes are supported");
      }
      if (size.price !== null && (!Number.isFinite(size.price) || size.price < 0)) {
        throw new Error(`Invalid price for ${product.name} ${size.label}`);
      }
      assertText(size.label, `${product.name}.${size.id}.label`);
      assertBoolean(size.active, `${product.name}.${size.id}.active`);
    }
  }
}

export async function getCmsContent() {
  noStore();
  const raw = await fs.readFile(contentPath, "utf8");
  const content: unknown = JSON.parse(raw);
  validateCmsContent(content);
  return content;
}

export async function saveCmsContent(input: unknown) {
  validateCmsContent(input);
  const current = await getCmsContent();
  const next: CmsContent = {
    ...input,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  const temporaryPath = `${contentPath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, contentPath);
  return next;
}

export async function getCmsProducts() {
  const content = await getCmsContent();
  return content.products.filter((product) => product.active);
}

export async function getCmsProduct(slug: string) {
  const products = await getCmsProducts();
  return products.find((product) => product.slug === slug);
}
