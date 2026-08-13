const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function phoneComparisonKey(value: unknown) {
  if (typeof value !== "string") return "";

  let digits = Array.from(value, (character) => {
    const arabicIndicIndex = ARABIC_INDIC_DIGITS.indexOf(character);
    if (arabicIndicIndex >= 0) return String(arabicIndicIndex);

    const easternArabicIndicIndex =
      EASTERN_ARABIC_INDIC_DIGITS.indexOf(character);
    if (easternArabicIndicIndex >= 0) return String(easternArabicIndicIndex);

    return character;
  })
    .join("")
    .replace(/\D/g, "");

  // Treat common Egyptian local and international formats as the same number.
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12)
    digits = digits.slice(2);

  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  return digits;
}
