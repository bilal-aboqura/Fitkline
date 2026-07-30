import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "fitkline-admin";
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function adminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && getSecret().length >= 24);
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(expected) && safeEqual(password, expected);
}

export function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(value?: string) {
  if (!value || !adminAuthConfigured()) return false;
  const [role, expiresAt, signature] = value.split(".");
  if (role !== "admin" || !expiresAt || !signature) return false;
  const payload = `${role}.${expiresAt}`;
  if (!safeEqual(signature, sign(payload))) return false;
  return Number(expiresAt) > Math.floor(Date.now() / 1000);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
}

