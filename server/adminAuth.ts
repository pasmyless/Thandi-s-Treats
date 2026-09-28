import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { getAdminAccount, seedAdminAccount, updateAdminPassword } from "./db";

const SESSION_COOKIE = "thandis_admin";
const ADMIN_ACCOUNTS = [
  { email: "mylesmuoka@gmail.com", displayName: "Myles" },
  { email: "naimathandi@gmail.com", displayName: "Naima" },
] as const;

function signingKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "local-development-signing-key");
}

function bootstrapPassword() {
  return process.env.ADMIN_BOOTSTRAP_PASSWORD || "123456789";
}

function makePasswordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function getCookie(cookieHeader?: string) {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(`${SESSION_COOKIE}=`.length);
}

export async function ensureAdminAccounts() {
  for (const admin of ADMIN_ACCOUNTS) {
    const existing = await getAdminAccount(admin.email);
    if (!existing) {
      const salt = randomBytes(24).toString("hex");
      await seedAdminAccount({
        ...admin,
        passwordSalt: salt,
        passwordHash: makePasswordHash(bootstrapPassword(), salt),
      });
    }
  }
}

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!ADMIN_ACCOUNTS.some(admin => admin.email === normalizedEmail)) return null;

  await ensureAdminAccounts();
  const account = await getAdminAccount(normalizedEmail);
  if (!account) return null;
  const expected = Buffer.from(account.passwordHash, "hex");
  const received = Buffer.from(makePasswordHash(password, account.passwordSalt), "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return { email: account.email, displayName: account.displayName };
}

export async function createAdminSession(admin: { email: string; displayName: string }) {
  return new SignJWT({ email: admin.email, displayName: admin.displayName, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(signingKey());
}

export async function getAdminSession(cookieHeader?: string) {
  const token = getCookie(cookieHeader);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey());
    if (payload.role !== "admin" || typeof payload.email !== "string") return null;
    return {
      email: payload.email,
      displayName: typeof payload.displayName === "string" ? payload.displayName : "Administrator",
    };
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(response: { cookie: Function }, token: string) {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAdminSessionCookie(response: { clearCookie: Function }) {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function requireAdmin(cookieHeader?: string) {
  const session = await getAdminSession(cookieHeader);
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Administrator sign-in required" });
  return session;
}

export async function changeAdminPassword(email: string, currentPassword: string, newPassword: string) {
  const admin = await authenticateAdmin(email, currentPassword);
  if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
  const salt = randomBytes(24).toString("hex");
  await updateAdminPassword(email, makePasswordHash(newPassword, salt), salt);
}

export const ADMIN_EMAILS = ADMIN_ACCOUNTS.map(admin => admin.email);
