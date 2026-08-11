export type ProductSizeId = "4kg" | "20kg";

export type ProductSize = {
  readonly id: ProductSizeId;
  readonly label: string;
  readonly price: number | null;
  readonly stock: number | null;
  readonly active: boolean;
};

export type Product = {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly action: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly step: string;
  readonly image: string;
  readonly catalogImage: string;
  readonly sizeImages: Readonly<Partial<Record<ProductSizeId, string>>>;
  readonly imageAlt: string;
  readonly benefits: readonly string[];
  readonly useCases: readonly string[];
  readonly howToUse: readonly string[];
  readonly safety: readonly string[];
  readonly sizes: readonly ProductSize[];
  readonly priceLabel: string;
  readonly active: boolean;
};

export type ProductVariant = {
  readonly product: Product;
  readonly size: ProductSize;
  readonly href: string;
  readonly image: string;
};

export function getProductVariantHref(
  slug: string,
  sizeId: ProductSizeId,
) {
  return `/products/${slug}/${sizeId}`;
}

export function getActiveProductVariants(
  catalog: readonly Product[],
): ProductVariant[] {
  const sizeOrder: readonly ProductSizeId[] = ["4kg", "20kg"];

  return sizeOrder.flatMap((sizeId) =>
    catalog.flatMap((product) => {
      const size = product.sizes.find(
        (candidate) => candidate.id === sizeId && candidate.active,
      );

      return size
        ? [{
        product,
        size,
        href: getProductVariantHref(product.slug, size.id),
        image: product.sizeImages[size.id] ?? product.image,
          }]
        : [];
    }),
  );
}

export function formatProductPrice(price: number) {
  return `${price.toLocaleString("ar-EG", {
    minimumFractionDigits: price % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })} ج.م`;
}

const sizes: readonly ProductSize[] = [
  { id: "4kg", label: "4 كجم", price: null, stock: null, active: true },
  { id: "20kg", label: "20 كجم", price: null, stock: null, active: true },
] as const;

const productImages = {
  gearfit: {
    "4kg": "/images/products/sterifit-4kg.png",
    "20kg": "/images/products/sterifit-20kg.png",
  },
  shinyfit: {
    "4kg": "/images/products/shinyfit-4kg.png",
    "20kg": "/images/products/shinyfit-20kg.png",
  },
  freshfit: {
    "4kg": "/images/products/fitmist-4kg.png",
    "20kg": "/images/products/fitmist-20kg.png",
  },
} as const;

export const products: readonly Product[] = [
  {
    slug: "gearfit",
    name: "STERIFIT",
    category: "تنظيف وصيانة أجهزة الجيم",
    action: "نظّف",
    shortDescription: "تنظيف يومي منظم للأجهزة والمساحات كثيرة الاستخدام.",
    description:
      "حل عملي للعناية بأجهزة الجيم والأسطح التي تمر عليها حركة مستمرة. اطلب الكمية المناسبة لمكانك وسيتم تأكيد السعر والتوفر مع فريق Fitkline.",
    step: "01",
    image: productImages.gearfit["4kg"],
    catalogImage: productImages.gearfit["4kg"],
    sizeImages: {
      "4kg": productImages.gearfit["4kg"],
      "20kg": productImages.gearfit["20kg"],
    },
    imageAlt: "عبوة سوداء من منتج STERIFIT لتنظيف وتعقيم أجهزة الجيم",
    benefits: [
      "مناسب لروتين النظافة اليومي داخل الجيم",
      "يساعد فريق التشغيل على الحفاظ على مظهر منظم",
      "متاح بأحجام موجهة للاستخدام الفردي أو التجاري",
    ],
    useCases: ["أجهزة الجيم", "الاستوديوهات الرياضية", "المناطق كثيرة الاستخدام"],
    howToUse: [
      "حدد المساحة أو الجهاز المطلوب تنظيفه.",
      "اتبع تعليمات العبوة بعد تأكيد المنتج المناسب.",
      "اختبر الاستخدام على مساحة صغيرة عند الحاجة.",
    ],
    safety: [
      "راجع ملصق المنتج وتعليمات الاستخدام قبل التشغيل.",
      "احفظ العبوة بعيدًا عن الأطفال والحرارة المباشرة.",
      "لا تخلط المنتج مع مواد أخرى دون تعليمات معتمدة.",
    ],
    sizes,
    priceLabel: "السعر بعد تأكيد الكمية والتوفر",
    active: true,
  },
  {
    slug: "shinyfit",
    name: "SHINYFIT",
    category: "العناية بأرضيات الملاعب والصالات",
    action: "لمّع",
    shortDescription: "عناية مخصصة بمظهر الأرضيات والمساحات الرياضية.",
    description:
      "حل للعناية بأرضيات الملاعب والصالات التي تحتاج إلى روتين واضح للحفاظ على شكل المكان. تواصل معنا لتحديد الحجم والاستخدام المناسبين.",
    step: "02",
    image: productImages.shinyfit["4kg"],
    catalogImage: productImages.shinyfit["4kg"],
    sizeImages: {
      "4kg": productImages.shinyfit["4kg"],
      "20kg": productImages.shinyfit["20kg"],
    },
    imageAlt: "عبوة سوداء من منتج SHINYFIT لتلميع أرضيات الجيم",
    benefits: [
      "موجه للعناية بمظهر الأرضيات الرياضية",
      "يناسب خطط التشغيل التي تحتاج إلى تكرار منظم",
      "اختيار الحجم يتم حسب مساحة المكان ومعدل الاستخدام",
    ],
    useCases: ["أرضيات الجيم", "صالات التدريب", "الملاعب الداخلية"],
    howToUse: [
      "حدد نوع الأرضية ومساحة الاستخدام.",
      "اتبع تعليمات العبوة والكمية الموصى بها بعد التأكيد.",
      "اترك المساحة جاهزة حسب تعليمات التشغيل الخاصة بالمكان.",
    ],
    safety: [
      "راجع توافق المنتج مع نوع الأرضية قبل الاستخدام.",
      "احفظ العبوة في مكان جاف ومغلق.",
      "استخدم معدات الحماية المطلوبة وفق تعليمات العبوة.",
    ],
    sizes,
    priceLabel: "السعر بعد تأكيد الكمية والتوفر",
    active: true,
  },
  {
    slug: "freshfit",
    name: "FITMIST",
    category: "العناية برائحة المنشآت الرياضية",
    action: "جدّد",
    shortDescription: "جزء من روتين الانطباع العام داخل الجيم والنادي.",
    description:
      "عناية برائحة المساحات الرياضية ضمن روتين تشغيل متكامل. نساعدك على اختيار الحجم المناسب بعد معرفة مساحة المكان وطريقة الاستخدام.",
    step: "03",
    image: productImages.freshfit["4kg"],
    catalogImage: productImages.freshfit["4kg"],
    sizeImages: {
      "4kg": productImages.freshfit["4kg"],
      "20kg": productImages.freshfit["20kg"],
    },
    imageAlt: "عبوة سوداء من منتج FITMIST لتعطير المنشآت الرياضية",
    benefits: [
      "يدعم روتين العناية بالمساحات المشتركة",
      "مناسب للجيمات والنوادي والاستوديوهات",
      "الحجم المناسب يعتمد على مساحة المكان ومعدل الاستخدام",
    ],
    useCases: ["صالات الاستقبال", "غرف تغيير الملابس", "ممرات ومناطق التدريب"],
    howToUse: [
      "حدد المساحات التي تحتاج إلى عناية بالرائحة.",
      "اتبع تعليمات العبوة ومعدل الاستخدام المعتمد.",
      "راقب التهوية واحتياجات المكان أثناء التشغيل.",
    ],
    safety: [
      "لا تستخدم المنتج في مكان مغلق دون تهوية مناسبة.",
      "راجع الملصق قبل الاستخدام والتخزين.",
      "احفظ العبوة بعيدًا عن مصادر الحرارة واللهب.",
    ],
    sizes,
    priceLabel: "السعر بعد تأكيد الكمية والتوفر",
    active: true,
  },
] as const;

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
