export type PerformanceBenefitIcon =
  | "safety"
  | "finish"
  | "facility"
  | "experience";

export type PerformanceBenefit = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly icon: PerformanceBenefitIcon;
};

export const performanceBenefits: readonly PerformanceBenefit[] = [
  {
    number: "01",
    title: "أمان أعلى",
    description:
      "حلول تساعد على الحفاظ على بيئة تدريب أنضف وأكثر أمانًا.",
    image: "/images/benefits/safety.webp",
    imageAlt: "حذاء رياضي يتحرك فوق أرضية تدريب نظيفة داخل جيم احترافي",
    icon: "safety",
  },
  {
    number: "02",
    title: "مظهر احترافي",
    description:
      "خلي الأرضيات، الأجهزة والمساحات دايمًا بأفضل شكل.",
    image: "/images/benefits/professional-finish.webp",
    imageAlt: "انعكاس الإضاءة على أرضية رياضية نظيفة ومعدة معدنية",
    icon: "finish",
  },
  {
    number: "03",
    title: "استخدام تجاري",
    description:
      "منتجات مناسبة للاستخدام المستمر داخل الجيمات والنوادي.",
    image: "/images/benefits/commercial-use.webp",
    imageAlt: "منشأة رياضية كبيرة مجهزة للاستخدام التجاري المستمر",
    icon: "facility",
  },
  {
    number: "04",
    title: "تجربة أفضل للمشتركين",
    description:
      "النظافة والريحة والانطباع العام جزء أساسي من تجربة العميل.",
    image: "/images/benefits/member-experience.webp",
    imageAlt: "متدرب يدخل مساحة جيم نظيفة ومنظمة",
    icon: "experience",
  },
] as const;
