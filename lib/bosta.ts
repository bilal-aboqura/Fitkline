import "server-only";

import { getSiteOrigin } from "@/lib/site-url";
import { phoneComparisonKey } from "@/lib/phone";
import { resolveShippingLocation } from "@/lib/shipping-store";
import type {
  BostaShipment,
  OrderStatus,
  StoredOrder,
} from "@/lib/order-store";
export { getBostaStateMeta } from "@/lib/bosta-status";
import { getBostaStateMeta } from "@/lib/bosta-status";

const BOSTA_API_URL = "https://app.bosta.co/api/v2";
const EGYPT_COUNTRY_ID = "60e4482c7cb7d4bc4849c4d5";

export const BOSTA_WEBHOOK_HEADER = "x-fitkline-bosta-webhook";

type BostaResponse<T> = {
  success?: boolean;
  message?: string;
  errorCode?: number | string;
  data?: T;
};

type BostaCity = {
  _id: string;
  name: string;
  nameAr?: string;
  alias?: string;
  code: string;
  dropOffAvailability?: boolean;
};

type BostaDistrict = {
  zoneId: string;
  zoneName: string;
  zoneOtherName?: string;
  districtId: string;
  districtName: string;
  districtOtherName?: string;
  dropOffAvailability?: boolean;
};

export type BostaPickupLocation = {
  _id: string;
  locationName?: string;
  isDefault?: boolean;
  contactPerson?: {
    name?: string;
    phone?: string;
    secPhone?: string;
    email?: string;
  };
  contacts?: Array<{
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    isDefault?: boolean;
  }>;
};

export type BostaPickup = {
  id: string;
  puid?: string;
  scheduledDate: string;
  scheduledTimeSlot?: string;
  state: string;
  businessLocationId: string;
};

type BostaDeliveryData = {
  _id?: string;
  trackingNumber?: string | number;
  businessReference?: string;
  state?: number | { code?: number; value?: string };
  maskedState?: string;
  type?: string | { code?: number; value?: string };
  uniqueBusinessReference?: string;
  receiver?: {
    phone?: string;
    secondPhone?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
  updatedAt?: string;
  creationTimestamp?: number;
  deliveryPromiseDate?: string;
  exceptionReason?: string;
  exceptionCode?: number;
  numberOfAttempts?: number;
  deliveryAttemptsLength?: number;
  timeline?: Array<{
    value?: string;
    nextAction?: string;
    done?: boolean;
    date?: string;
  }>;
};

export type BostaDeliveryImport = {
  shipment: BostaShipment;
  businessReferences: string[];
  phones: string[];
  receiverName: string;
};

export type BostaWebhookPayload = {
  _id?: unknown;
  trackingNumber?: unknown;
  state?: unknown;
  timeStamp?: unknown;
  deliveryPromiseDate?: unknown;
  exceptionReason?: unknown;
  exceptionCode?: unknown;
  businessReference?: unknown;
  numberOfAttempts?: unknown;
  type?: unknown;
  cod?: unknown;
};

const governorateCodes: Record<string, string> = {
  cairo: "EG-01",
  alexandria: "EG-02",
  "al-beheira": "EG-04",
  "al-daqahliya": "EG-05",
  qalyubia: "EG-06",
  "al-gharbia": "EG-07",
  "kafr-el-sheikh": "EG-08",
  "al-monufia": "EG-09",
  "al-sharqia": "EG-10",
  ismailia: "EG-11",
  suez: "EG-12",
  "port-said": "EG-13",
  damietta: "EG-14",
  "al-fayoum": "EG-15",
  "bani-souaif": "EG-16",
  asyut: "EG-17",
  sohag: "EG-18",
  "al-meniya": "EG-19",
  qena: "EG-20",
  aswan: "EG-21",
  luxor: "EG-22",
  "red-sea": "EG-23",
  "new-valley": "EG-24",
  giza: "EG-25",
  "south-sinai": "EG-26",
  "north-sinai": "EG-27",
  matrooh: "EG-28",
};

export class BostaIntegrationError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "BostaIntegrationError";
  }
}

export function getBostaConfiguration() {
  const apiKey = process.env.BOSTA_API_KEY?.trim() ?? "";
  const webhookSecret = process.env.BOSTA_WEBHOOK_SECRET?.trim() ?? "";
  const webhookUrl = `${getSiteOrigin()}/api/webhooks/bosta`;
  const publicSite = !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    getSiteOrigin(),
  );

  return {
    apiKey,
    webhookSecret,
    webhookUrl,
    publicSite,
    ready: Boolean(apiKey && webhookSecret && publicSite),
  };
}

function getRequiredConfiguration() {
  const configuration = getBostaConfiguration();
  if (!configuration.ready) {
    throw new BostaIntegrationError(
      "إعداد بوسطة غير مكتمل. راجع المفتاح ورابط الموقع ومفتاح الـWebhook.",
      503,
    );
  }
  return configuration;
}

function bostaErrorMessage(result: BostaResponse<unknown>, status: number) {
  const code = result.errorCode ? ` (${result.errorCode})` : "";
  const known: Record<string, string> = {
    "1073": "أضف عنوان استلام افتراضي لحسابك في بوسطة أولًا.",
    "3001": "المحافظة غير موجودة في مناطق بوسطة.",
    "3002": "المنطقة غير موجودة في مناطق بوسطة.",
    "3003": "الحي غير موجود في مناطق بوسطة.",
    "3007": "قيمة التحصيل تتجاوز الحد المسموح في بوسطة.",
    "1077": "مكان الاستلام في بوسطة يحتاج جهة اتصال افتراضية.",
    "1078": "يوجد طلب استلام آخر لنفس المكان والتاريخ.",
    "1080": "بوسطة لا تقبل جدولة الاستلام يوم الجمعة.",
    "1081": "انتهى وقت قبول طلبات الاستلام لهذا اليوم.",
    "1083": "لا يمكن جدولة الاستلام في تاريخ سابق.",
    "2022": "التاريخ المحدد إجازة لدى بوسطة.",
    "2027": "تم إنشاء طلب استلام بالفعل اليوم.",
  };
  const translated = result.errorCode
    ? known[String(result.errorCode)]
    : undefined;
  return `${translated ?? result.message ?? `رفضت بوسطة الطلب برمز ${status}.`}${code}`;
}

async function bostaJson<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (authenticated) {
    headers.set("Authorization", getRequiredConfiguration().apiKey);
  }

  let response: Response;
  try {
    response = await fetch(`${BOSTA_API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new BostaIntegrationError(
      "تعذر الاتصال ببوسطة حاليًا. جرّب مرة أخرى بعد قليل.",
    );
  }

  let result: BostaResponse<T>;
  try {
    result = (await response.json()) as BostaResponse<T>;
  } catch {
    throw new BostaIntegrationError("وصل رد غير صالح من بوسطة.");
  }
  if (!response.ok || result.success === false || result.data === undefined) {
    throw new BostaIntegrationError(
      bostaErrorMessage(result, response.status),
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }
  return result.data;
}

function normalized(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function findDistrict(
  districts: BostaDistrict[],
  names: string[],
) {
  const candidates = new Set(names.filter(Boolean).map(normalized));
  const available = districts.filter(
    (district) => district.dropOffAvailability !== false,
  );
  const direct = available.find((district) =>
    [district.districtName, district.districtOtherName ?? ""].some((name) =>
      candidates.has(normalized(name)),
    ),
  );
  if (direct) return direct;

  const zoneMatches = available.filter((district) =>
    [district.zoneName, district.zoneOtherName ?? ""].some((name) =>
      candidates.has(normalized(name)),
    ),
  );
  return (
    zoneMatches.find(
      (district) =>
        normalized(district.districtName) === normalized(district.zoneName),
    ) ?? zoneMatches[0]
  );
}

async function getBostaAddress(order: StoredOrder) {
  const location = await resolveShippingLocation(
    order.customer.governorateId,
    order.customer.cityId,
    { includeInactive: true },
  );
  if (!location) {
    throw new BostaIntegrationError(
      "تعذر العثور على محافظة ومدينة الطلب في إعدادات الشحن.",
      400,
    );
  }

  const code = governorateCodes[location.governorate.id];
  if (!code) {
    throw new BostaIntegrationError(
      `المحافظة «${location.governorate.nameAr}» غير مربوطة بمناطق بوسطة.`,
      400,
    );
  }
  const cities = await bostaJson<{ list: BostaCity[] }>(
    `/cities?countryId=${EGYPT_COUNTRY_ID}`,
    {},
    false,
  );
  const bostaCity = cities.list.find(
    (city) => city.code === code && city.dropOffAvailability !== false,
  );
  if (!bostaCity) {
    throw new BostaIntegrationError(
      `بوسطة لا تستقبل شحنات إلى «${location.governorate.nameAr}» حاليًا.`,
      400,
    );
  }

  const districts = await bostaJson<BostaDistrict[]>(
    `/cities/${encodeURIComponent(bostaCity._id)}/districts`,
    {},
    false,
  );
  const district = findDistrict(districts, [
    location.city.nameAr,
    location.city.nameEn,
  ]);

  return {
    city: bostaCity.name,
    cityId: bostaCity._id,
    ...(district
      ? { districtId: district.districtId, zoneId: district.zoneId }
      : { districtName: location.city.nameEn }),
    firstLine: order.customer.address,
    isWorkAddress: false,
  };
}

function egyptianPhone(value: string) {
  const comparisonKey = phoneComparisonKey(value);
  return comparisonKey.length === 10 ? `0${comparisonKey}` : value.trim();
}

function packageSize(order: StoredOrder) {
  const kilograms = order.items.reduce((total, item) => {
    const parsed = Number.parseFloat(item.sizeId);
    return total + (Number.isFinite(parsed) ? parsed : 0) * item.quantity;
  }, 0);
  if (kilograms <= 5) return "SMALL";
  if (kilograms <= 15) return "MEDIUM";
  return "LARGE";
}

function shipmentFromDelivery(
  delivery: BostaDeliveryData,
  existing?: BostaShipment,
): BostaShipment {
  const stateCode =
    typeof delivery.state === "number"
      ? delivery.state
      : Number(delivery.state?.code ?? existing?.stateCode ?? 10);
  const stateDefinition = getBostaStateMeta(stateCode);
  const stateValue =
    typeof delivery.state === "object" && delivery.state?.value
      ? delivery.state.value
      : existing?.stateValue ?? stateDefinition.value;
  const timestamp = delivery.updatedAt
    ? new Date(delivery.updatedAt).toISOString()
    : delivery.creationTimestamp
      ? new Date(delivery.creationTimestamp).toISOString()
      : new Date().toISOString();

  return {
    deliveryId: String(delivery._id ?? existing?.deliveryId ?? ""),
    trackingNumber: String(
      delivery.trackingNumber ?? existing?.trackingNumber ?? "",
    ),
    stateCode,
    stateValue,
    dashboardState:
      delivery.maskedState ??
      existing?.dashboardState ??
      stateDefinition.dashboard,
    ...(delivery.type
      ? {
          type:
            typeof delivery.type === "string"
              ? delivery.type
              : delivery.type.value ?? String(delivery.type.code ?? ""),
        }
      : existing?.type
        ? { type: existing.type }
        : {}),
    stateUpdatedAt: timestamp,
    ...(delivery.deliveryPromiseDate
      ? { deliveryPromiseDate: delivery.deliveryPromiseDate }
      : existing?.deliveryPromiseDate
        ? { deliveryPromiseDate: existing.deliveryPromiseDate }
        : {}),
    ...(delivery.exceptionReason
      ? { exceptionReason: delivery.exceptionReason }
      : {}),
    ...(typeof delivery.exceptionCode === "number"
      ? { exceptionCode: delivery.exceptionCode }
      : {}),
    ...(typeof delivery.numberOfAttempts === "number"
      ? { numberOfAttempts: delivery.numberOfAttempts }
      : typeof delivery.deliveryAttemptsLength === "number"
        ? { numberOfAttempts: delivery.deliveryAttemptsLength }
        : existing?.numberOfAttempts !== undefined
          ? { numberOfAttempts: existing.numberOfAttempts }
          : {}),
    ...(Array.isArray(delivery.timeline)
      ? {
          timeline: delivery.timeline
            .filter((item) => typeof item.value === "string")
            .map((item) => ({
              value: item.value!,
              done: Boolean(item.done),
              ...(item.nextAction ? { nextAction: item.nextAction } : {}),
              ...(item.date ? { date: item.date } : {}),
            })),
        }
      : existing?.timeline
        ? { timeline: existing.timeline }
        : {}),
    ...(existing?.pickup ? { pickup: existing.pickup } : {}),
  };
}

export async function listBostaDeliveriesForImport() {
  const limit = 100;
  const imports: BostaDeliveryImport[] = [];

  for (let page = 1; page <= 100; page += 1) {
    const result = await bostaJson<{
      deliveries?: BostaDeliveryData[];
    }>("/deliveries/search", {
      method: "POST",
      body: JSON.stringify({ page, limit }),
    });
    const deliveries = result.deliveries ?? [];
    for (const delivery of deliveries) {
      const shipment = shipmentFromDelivery(delivery);
      if (!shipment.deliveryId || !shipment.trackingNumber) continue;
      const receiverName =
        delivery.receiver?.fullName?.trim() ||
        [delivery.receiver?.firstName, delivery.receiver?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      imports.push({
        shipment,
        businessReferences: [
          delivery.businessReference,
          delivery.uniqueBusinessReference,
        ].filter((value): value is string => Boolean(value?.trim())),
        phones: [delivery.receiver?.phone, delivery.receiver?.secondPhone].filter(
          (value): value is string => Boolean(value?.trim()),
        ),
        receiverName,
      });
    }
    if (deliveries.length < limit) break;
  }

  return imports;
}

export async function createBostaDelivery(order: StoredOrder) {
  if (order.bosta?.trackingNumber) {
    throw new BostaIntegrationError("الطلب مربوط بشحنة بوسطة بالفعل.", 409);
  }
  if (order.subtotal === null || order.total === null) {
    throw new BostaIntegrationError(
      "لا يمكن إنشاء الشحنة قبل تأكيد أسعار الطلب والشحن.",
      400,
    );
  }

  const configuration = getRequiredConfiguration();
  const dropOffAddress = await getBostaAddress(order);
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const description = order.items
    .map((item) => `${item.name} ${item.sizeLabel} × ${item.quantity}`)
    .join("، ")
    .slice(0, 200);
  const names = order.customer.name.trim().split(/\s+/);
  const delivery = await bostaJson<BostaDeliveryData>(
    "/deliveries?apiVersion=1",
    {
      method: "POST",
      body: JSON.stringify({
        type: 10,
        specs: {
          packageType: "Parcel",
          size: packageSize(order),
          packageDetails: { itemsCount: itemCount, description },
        },
        goodsInfo: { amount: order.subtotal },
        notes: [order.reference, order.notes].filter(Boolean).join(" — ").slice(0, 200),
        cod: order.paymentMethod === "cod" ? order.total : 0,
        dropOffAddress,
        businessReference: order.reference,
        uniqueBusinessReference: order.reference,
        receiver: {
          firstName: names[0] || order.customer.name,
          lastName: names.slice(1).join(" "),
          fullName: order.customer.name,
          phone: egyptianPhone(order.customer.phone),
          secondPhone: egyptianPhone(order.customer.alternatePhone ?? ""),
          email: order.customer.email,
        },
        webhookUrl: configuration.webhookUrl,
        webhookCustomHeaders: {
          [BOSTA_WEBHOOK_HEADER]: configuration.webhookSecret,
        },
      }),
    },
  );
  const shipment = shipmentFromDelivery(delivery);
  if (!shipment.deliveryId || !shipment.trackingNumber) {
    throw new BostaIntegrationError(
      "تم إنشاء الشحنة لكن بوسطة لم ترسل رقم التتبع. راجع حساب بوسطة.",
    );
  }
  return syncBostaDelivery(shipment).catch(() => shipment);
}

export async function syncBostaDelivery(shipment: BostaShipment) {
  const delivery = await bostaJson<BostaDeliveryData>(
    `/deliveries/business/${encodeURIComponent(shipment.trackingNumber)}`,
  );
  return shipmentFromDelivery(delivery, shipment);
}

export function shipmentFromWebhook(
  payload: BostaWebhookPayload,
  existing?: BostaShipment,
) {
  const timestamp = Number(payload.timeStamp);
  return shipmentFromDelivery(
    {
      _id: typeof payload._id === "string" ? payload._id : undefined,
      trackingNumber:
        typeof payload.trackingNumber === "string" ||
        typeof payload.trackingNumber === "number"
          ? payload.trackingNumber
          : undefined,
      state: Number(payload.state),
      updatedAt: Number.isFinite(timestamp)
        ? new Date(timestamp).toISOString()
        : undefined,
      deliveryPromiseDate:
        typeof payload.deliveryPromiseDate === "string"
          ? payload.deliveryPromiseDate
          : undefined,
      exceptionReason:
        typeof payload.exceptionReason === "string"
          ? payload.exceptionReason
          : undefined,
      exceptionCode:
        typeof payload.exceptionCode === "number"
          ? payload.exceptionCode
          : undefined,
      numberOfAttempts:
        typeof payload.numberOfAttempts === "number"
          ? payload.numberOfAttempts
          : undefined,
      type: typeof payload.type === "string" ? payload.type : undefined,
    },
    existing,
  );
}

export function orderStatusForBostaState(
  stateCode: number,
  current: OrderStatus,
): OrderStatus {
  if (stateCode === 45) return "completed";
  if ([46, 48, 49, 100, 101].includes(stateCode)) return "cancelled";
  if (stateCode === 10) return current === "new" ? "processing" : current;
  if ([60, 104].includes(stateCode)) return current;
  return ["completed", "cancelled"].includes(current) ? current : "shipped";
}

export async function verifyBostaConnection() {
  const data = await listBostaPickupLocations();
  return {
    pickupLocations: data.length,
    hasDefaultPickup: Boolean(data.some((location) => location.isDefault)),
  };
}

export async function listBostaPickupLocations() {
  const data = await bostaJson<{
    total?: number;
    list?: BostaPickupLocation[];
  }>("/pickup-locations");
  return data.list ?? [];
}

export async function getAvailableBostaPickupDates(days = 7) {
  const dates = await bostaJson<string[]>(
    `/pickups/available-dates?days=${Math.max(1, Math.min(30, days))}`,
  );
  return dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
}

export async function createBostaPickup(input: {
  location: BostaPickupLocation;
  scheduledDate: string;
  trackingNumbers: string[];
  hasBigItems: boolean;
  hasFragileItems?: boolean;
  notes?: string;
}) {
  const defaultContact =
    input.location.contacts?.find((contact) => contact.isDefault) ??
    input.location.contacts?.[0];
  const contactName = [defaultContact?.firstName, defaultContact?.lastName]
    .filter(Boolean)
    .join(" ");
  const name =
    input.location.contactPerson?.name ||
    contactName ||
    defaultContact?.name;
  const phone =
    input.location.contactPerson?.phone ?? defaultContact?.phone ?? "";
  if (!name || !phone) {
    throw new BostaIntegrationError(
      "مكان الاستلام الافتراضي في بوسطة لا يحتوي على جهة اتصال ورقم هاتف.",
      400,
    );
  }

  const pickup = await bostaJson<{
    _id?: string;
    puid?: string;
    scheduledDate?: string;
    scheduledTimeSlot?: string;
    state?: string;
    businessLocationId?: string;
  }>("/pickups", {
    method: "POST",
    body: JSON.stringify({
      businessLocationId: input.location._id,
      scheduledDate: input.scheduledDate,
      contactPerson: {
        name,
        phone,
        secPhone: input.location.contactPerson?.secPhone,
        email:
          input.location.contactPerson?.email ?? defaultContact?.email,
      },
      notes: input.notes?.slice(0, 500) || "Fitkline confirmed orders",
      numberOfParcels: input.trackingNumbers.length,
      packageType: "Normal",
      hasFragileItems: Boolean(input.hasFragileItems),
      hasBigItems: input.hasBigItems,
      trackingNumbers: input.trackingNumbers,
      repeatedData: { repeatedType: "One Time", days: [] },
    }),
  });
  if (!pickup._id) {
    throw new BostaIntegrationError(
      "تم إرسال طلب الاستلام لكن بوسطة لم ترسل رقمه.",
    );
  }
  return {
    id: pickup._id,
    ...(pickup.puid ? { puid: pickup.puid } : {}),
    scheduledDate: input.scheduledDate,
    ...(pickup.scheduledTimeSlot
      ? { scheduledTimeSlot: pickup.scheduledTimeSlot }
      : {}),
    state: pickup.state ?? "Requested",
    businessLocationId: pickup.businessLocationId ?? input.location._id,
  } satisfies BostaPickup;
}

export async function downloadBostaAwb(trackingNumbers: string) {
  const configuration = getRequiredConfiguration();
  const response = await fetch(`${BOSTA_API_URL}/deliveries/mass-awb`, {
    method: "POST",
    headers: {
      Authorization: configuration.apiKey,
      Accept: "application/pdf, application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trackingNumbers,
      requestedAwbType: "A4",
      lang: "ar",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  if (response.ok && contentType.includes("application/pdf")) return bytes;

  const text = new TextDecoder().decode(bytes);
  let result: BostaResponse<unknown> = {};
  try {
    result = JSON.parse(text) as BostaResponse<unknown>;
  } catch {
    // Some Bosta accounts receive the base64 PDF as plain text.
  }
  if (!response.ok || result.success === false) {
    throw new BostaIntegrationError(
      bostaErrorMessage(result, response.status),
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }
  const data = result.data;
  const candidate =
    typeof data === "string"
      ? data
      : data && typeof data === "object"
        ? Object.values(data as Record<string, unknown>).find(
            (value) => typeof value === "string" && value.length > 100,
          )
        : text;
  if (typeof candidate !== "string") {
    throw new BostaIntegrationError("تعذر قراءة بوليصة الشحن من رد بوسطة.");
  }
  const base64 = candidate.replace(/^data:application\/pdf;base64,/, "").trim();
  const pdf = Uint8Array.from(Buffer.from(base64, "base64"));
  if (pdf.length < 4 || new TextDecoder().decode(pdf.slice(0, 4)) !== "%PDF") {
    throw new BostaIntegrationError("رد بوسطة لا يحتوي على بوليصة PDF صالحة.");
  }
  return pdf;
}
