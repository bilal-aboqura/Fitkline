export type BostaStateTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger";

export type BostaStatusKey =
  | "new"
  | "waiting-pickup"
  | "picked-up"
  | "stored"
  | "processing"
  | "heading-customer"
  | "returning"
  | "heading-you"
  | "awaiting-action"
  | "rejected-returns"
  | "successful"
  | "returned"
  | "unsuccessful"
  | "archived"
  | "terminated";

export type BostaStatusGroupId =
  | "new"
  | "processing"
  | "paused"
  | "successful"
  | "unsuccessful";

export type BostaStateDefinition = {
  code: number;
  value: string;
  dashboard: string;
  labelAr: string;
  tone: BostaStateTone;
};

export const bostaStates: BostaStateDefinition[] = [
  { code: 10, value: "Pickup requested", dashboard: "New", labelAr: "جديد", tone: "neutral" },
  { code: 11, value: "Waiting for route", dashboard: "In progress", labelAr: "قيد التنفيذ", tone: "info" },
  { code: 20, value: "Route Assigned", dashboard: "In progress", labelAr: "قيد التنفيذ", tone: "info" },
  { code: 21, value: "Picked up from business", dashboard: "Picked up", labelAr: "تم استلام الأوردر", tone: "info" },
  { code: 22, value: "Picking up from consignee", dashboard: "Heading to customer", labelAr: "متجه للعميل", tone: "info" },
  { code: 23, value: "Picked up from consignee", dashboard: "Picked up", labelAr: "مرتجعاتك العائدة", tone: "warning" },
  { code: 24, value: "Received at warehouse", dashboard: "In progress", labelAr: "تم تخزينه", tone: "info" },
  { code: 25, value: "Fulfilled", dashboard: "Fulfilled", labelAr: "تم تخزينه", tone: "info" },
  { code: 30, value: "In transit between Hubs", dashboard: "In progress", labelAr: "قيد التنفيذ", tone: "info" },
  { code: 40, value: "Picking up", dashboard: "Heading to customer", labelAr: "متجه للعميل", tone: "info" },
  { code: 41, value: "Picked up", dashboard: "Heading to customer", labelAr: "متجه للعميل", tone: "info" },
  { code: 45, value: "Delivered", dashboard: "Successful", labelAr: "تم بنجاح", tone: "success" },
  { code: 46, value: "Returned to business", dashboard: "Successful", labelAr: "تم الاسترجاع", tone: "danger" },
  { code: 47, value: "Exception", dashboard: "In progress", labelAr: "في انتظار متابعتك", tone: "warning" },
  { code: 48, value: "Terminated", dashboard: "Terminated", labelAr: "تم إنهاؤه", tone: "danger" },
  { code: 49, value: "Canceled", dashboard: "In progress", labelAr: "لم يتم بنجاح", tone: "danger" },
  { code: 60, value: "Returned to stock", dashboard: "Returned", labelAr: "تم الاسترجاع", tone: "danger" },
  { code: 100, value: "Lost", dashboard: "Unsuccessful", labelAr: "لم يتم بنجاح", tone: "danger" },
  { code: 101, value: "Damaged", dashboard: "Unsuccessful", labelAr: "لم يتم بنجاح", tone: "danger" },
  { code: 102, value: "Investigation", dashboard: "In progress", labelAr: "قيد التنفيذ", tone: "warning" },
  { code: 103, value: "Awaiting your action", dashboard: "Awaiting your action", labelAr: "في انتظار متابعتك", tone: "warning" },
  { code: 104, value: "Archived", dashboard: "Archived", labelAr: "مؤرشف", tone: "neutral" },
  { code: 105, value: "On hold", dashboard: "In progress", labelAr: "قيد التنفيذ", tone: "warning" },
];

const unknownState: BostaStateDefinition = {
  code: -1,
  value: "Unknown",
  dashboard: "Unknown",
  labelAr: "قيد التنفيذ",
  tone: "neutral",
};

export function getBostaStateMeta(code: number) {
  return bostaStates.find((state) => state.code === code) ?? {
    ...unknownState,
    code,
  };
}

export const bostaStatusGroups: Array<{
  id: BostaStatusGroupId;
  label: string;
  options: Array<{ key: BostaStatusKey; label: string }>;
}> = [
  {
    id: "new",
    label: "جديد",
    options: [
      { key: "new", label: "جديد" },
      { key: "waiting-pickup", label: "في انتظار الاستلام" },
    ],
  },
  {
    id: "processing",
    label: "الأوردرات قيد التنفيذ",
    options: [
      { key: "picked-up", label: "تم استلام الأوردر" },
      { key: "stored", label: "تم تخزينه" },
      { key: "processing", label: "قيد التنفيذ" },
      { key: "heading-customer", label: "متجه للعميل" },
      { key: "returning", label: "مرتجعاتك العائدة" },
      { key: "heading-you", label: "في الطريق إليك" },
    ],
  },
  {
    id: "paused",
    label: "متوقف مؤقتا",
    options: [
      { key: "awaiting-action", label: "في انتظار متابعتك" },
      { key: "rejected-returns", label: "مرتجعات مرفوضة" },
    ],
  },
  {
    id: "successful",
    label: "تم بنجاح",
    options: [{ key: "successful", label: "تم بنجاح" }],
  },
  {
    id: "unsuccessful",
    label: "غير ناجح",
    options: [
      { key: "returned", label: "تم الاسترجاع" },
      { key: "unsuccessful", label: "لم يتم بنجاح" },
      { key: "archived", label: "مؤرشف" },
      { key: "terminated", label: "تم إنهاؤه" },
    ],
  },
];

type ShipmentForDisplay = {
  stateCode: number;
  type?: string;
  pickup?: { id: string };
};

const returnTypes = ["RTO", "RETURN", "EXCHANGE", "CUSTOMER_RETURN_PICKUP"];

function isReturnShipment(type?: string) {
  const normalizedType = type?.trim().toUpperCase() ?? "";
  return returnTypes.some((value) => normalizedType.includes(value));
}

export function getBostaDisplayStatus(shipment: ShipmentForDisplay) {
  const meta = getBostaStateMeta(shipment.stateCode);
  let groupId: BostaStatusGroupId = "processing";
  let key: BostaStatusKey = "processing";

  if (shipment.stateCode === 10) {
    groupId = "new";
    key = shipment.pickup?.id ? "waiting-pickup" : "new";
  } else if (shipment.stateCode === 11) {
    key = "processing";
  } else if (shipment.stateCode === 21) {
    key = "picked-up";
  } else if ([24, 25].includes(shipment.stateCode)) {
    key = "stored";
  } else if ([22, 40, 41].includes(shipment.stateCode)) {
    key = isReturnShipment(shipment.type) ? "heading-you" : "heading-customer";
  } else if (shipment.stateCode === 23) {
    key = "returning";
  } else if ([47, 103].includes(shipment.stateCode)) {
    groupId = "paused";
    key = shipment.stateCode === 47 && isReturnShipment(shipment.type)
      ? "rejected-returns"
      : "awaiting-action";
  } else if (shipment.stateCode === 45) {
    groupId = "successful";
    key = "successful";
  } else if ([46, 60].includes(shipment.stateCode)) {
    groupId = "unsuccessful";
    key = "returned";
  } else if ([49, 100, 101].includes(shipment.stateCode)) {
    groupId = "unsuccessful";
    key = "unsuccessful";
  } else if (shipment.stateCode === 104) {
    groupId = "unsuccessful";
    key = "archived";
  } else if (shipment.stateCode === 48) {
    groupId = "unsuccessful";
    key = "terminated";
  }

  const group = bostaStatusGroups.find((item) => item.id === groupId)!;
  const option = group.options.find((item) => item.key === key)!;
  return {
    groupId,
    groupLabel: group.label,
    key,
    label: option.label,
    tone: meta.tone,
  };
}
