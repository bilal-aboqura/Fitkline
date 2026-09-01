export type MylerzStatusTone = "neutral" | "info" | "success" | "danger";

export function mylerzStatusLabel(status: string): {
  label: string;
  tone: MylerzStatusTone;
} {
  const normalized = status.toLowerCase();
  if (normalized.includes("deliver")) return { label: "تم التسليم", tone: "success" };
  if (normalized.includes("return") || normalized.includes("cancel") || normalized.includes("fail")) return { label: "تعذر التسليم", tone: "danger" };
  if (normalized.includes("pick") || normalized.includes("transit") || normalized.includes("out for")) return { label: "قيد التوصيل", tone: "info" };
  return { label: "قيد التجهيز", tone: "neutral" };
}
