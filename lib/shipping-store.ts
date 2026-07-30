import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type ShippingCity = {
  id: number;
  governorateId: string;
  nameAr: string;
  nameEn: string;
  shippingPrice: number | null;
  active: boolean;
  sortOrder: number;
};

export type ShippingGovernorate = {
  id: string;
  nameAr: string;
  nameEn: string;
  shippingPrice: number | null;
  active: boolean;
  sortOrder: number;
  cities: ShippingCity[];
};

type GovernorateRow = {
  id: string;
  name_ar: string;
  name_en: string;
  shipping_price: number | string | null;
  active: boolean;
  sort_order: number;
};

type CityRow = {
  id: number;
  governorate_id: string;
  name_ar: string;
  name_en: string;
  shipping_price: number | string | null;
  active: boolean;
  sort_order: number;
};

function nullableNumber(value: number | string | null) {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toCity(row: CityRow): ShippingCity {
  return {
    id: row.id,
    governorateId: row.governorate_id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    shippingPrice: nullableNumber(row.shipping_price),
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export async function getShippingLocations(options?: { includeInactive?: boolean }) {
  noStore();
  const supabase = getSupabaseServerClient();
  let governoratesQuery = supabase
    .from("fitkline_governorates")
    .select("*")
    .order("sort_order")
    .order("name_ar");
  let citiesQuery = supabase
    .from("fitkline_cities")
    .select("*")
    .order("sort_order")
    .order("name_ar");

  if (!options?.includeInactive) {
    governoratesQuery = governoratesQuery.eq("active", true);
    citiesQuery = citiesQuery.eq("active", true);
  }

  const [governoratesResult, citiesResult] = await Promise.all([
    governoratesQuery,
    citiesQuery,
  ]);
  if (governoratesResult.error) throw governoratesResult.error;
  if (citiesResult.error) throw citiesResult.error;

  const cityRows = (citiesResult.data ?? []) as CityRow[];
  const citiesByGovernorate = new Map<string, ShippingCity[]>();
  for (const row of cityRows) {
    const city = toCity(row);
    const current = citiesByGovernorate.get(city.governorateId) ?? [];
    current.push(city);
    citiesByGovernorate.set(city.governorateId, current);
  }

  return ((governoratesResult.data ?? []) as GovernorateRow[]).map(
    (row): ShippingGovernorate => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      shippingPrice: nullableNumber(row.shipping_price),
      active: row.active,
      sortOrder: row.sort_order,
      cities: citiesByGovernorate.get(row.id) ?? [],
    }),
  );
}

export async function resolveShippingLocation(
  governorateId: string,
  cityId: number,
) {
  const locations = await getShippingLocations();
  const governorate = locations.find((item) => item.id === governorateId);
  const city = governorate?.cities.find((item) => item.id === cityId);
  if (!governorate || !city) return null;
  return {
    governorate,
    city,
    shippingPrice: city.shippingPrice ?? governorate.shippingPrice,
  };
}

function assertShippingLocations(value: unknown): asserts value is ShippingGovernorate[] {
  if (!Array.isArray(value)) throw new Error("قائمة الشحن غير صالحة.");
  for (const governorate of value) {
    if (
      !governorate ||
      typeof governorate !== "object" ||
      typeof governorate.id !== "string" ||
      typeof governorate.active !== "boolean" ||
      !Array.isArray(governorate.cities)
    ) {
      throw new Error("بيانات المحافظة غير صالحة.");
    }
    if (
      governorate.shippingPrice !== null &&
      (!Number.isFinite(governorate.shippingPrice) ||
        governorate.shippingPrice < 0)
    ) {
      throw new Error(`سعر شحن ${governorate.nameAr} غير صالح.`);
    }
    for (const city of governorate.cities) {
      if (
        !city ||
        typeof city.id !== "number" ||
        typeof city.active !== "boolean" ||
        (city.shippingPrice !== null &&
          (!Number.isFinite(city.shippingPrice) || city.shippingPrice < 0))
      ) {
        throw new Error(`بيانات مدينة داخل ${governorate.nameAr} غير صالحة.`);
      }
    }
  }
}

export async function saveShippingLocations(input: unknown) {
  assertShippingLocations(input);
  const supabase = getSupabaseServerClient();
  const governorates = input.map((item) => ({
    id: item.id,
    name_ar: item.nameAr,
    name_en: item.nameEn,
    shipping_price: item.shippingPrice,
    active: item.active,
    sort_order: item.sortOrder,
    updated_at: new Date().toISOString(),
  }));
  const cities = input.flatMap((governorate) =>
    governorate.cities.map((city) => ({
      id: city.id,
      governorate_id: governorate.id,
      name_ar: city.nameAr,
      name_en: city.nameEn,
      shipping_price: city.shippingPrice,
      active: city.active,
      sort_order: city.sortOrder,
      updated_at: new Date().toISOString(),
    })),
  );

  const governoratesResult = await supabase
    .from("fitkline_governorates")
    .upsert(governorates, { onConflict: "id" });
  if (governoratesResult.error) throw governoratesResult.error;

  for (let index = 0; index < cities.length; index += 500) {
    const result = await supabase
      .from("fitkline_cities")
      .upsert(cities.slice(index, index + 500), { onConflict: "id" });
    if (result.error) throw result.error;
  }

  return getShippingLocations({ includeInactive: true });
}
