import Link from "next/link";

const routineSteps = [
  {
    index: "01",
    title: "حدد المنطقة",
    description: "جهاز، أرضية، أو مساحة مشتركة. نقطة البداية بتتحدد من المكان اللي محتاج عناية.",
    label: "المساحة",
  },
  {
    index: "02",
    title: "اختار الحل",
    description: "كل منتج له دور واضح داخل روتين المنشأة، من غير ما نحمّل منتجًا وظيفة مش مخصصة له.",
    label: "المنتج",
  },
  {
    index: "03",
    title: "أكد الكمية",
    description: "بعد معرفة المساحة ومعدل الاستخدام، نراجع الحجم والتوافر والسعر مع فريقك.",
    label: "الكمية",
  },
] as const;

export function FacilityRoutine() {
  return (
    <section className="facility-routine" aria-labelledby="facility-routine-title">
      <div className="fit-container">
        <div className="facility-routine__header">
          <div>
            <p className="facility-routine__kicker">روتين تشغيل أوضح</p>
            <h2 id="facility-routine-title">من أول مساحة<br /><span>لأول طلب.</span></h2>
          </div>
          <p>اختيار المنتج مش خطوة منفصلة عن تشغيل المكان. هو قرار يبدأ من نوع الاستخدام، وينتهي بروتين تقدر تكرره بثبات.</p>
        </div>

        <ol className="facility-routine__steps">
          {routineSteps.map((step) => (
            <li key={step.index}>
              <div className="facility-routine__step-top">
                <span dir="ltr">{step.index}</span>
                <span>{step.label}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <span className="facility-routine__arrow" aria-hidden="true">↙</span>
            </li>
          ))}
        </ol>

        <div className="facility-routine__footer">
          <p>مش متأكد تبدأ منين؟</p>
          <Link className="facility-routine__link" href="/contact">خلّي فريق Fitkline يرشحلك البداية <span aria-hidden="true">←</span></Link>
        </div>
      </div>
    </section>
  );
}
