import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { db } from "./db";

const COOKIE = "murano_media_session";
const SESSION_DAYS = 14;

function sessionSecret() {
  return process.env.MURANO_SESSION_SECRET || process.env.MURANO_ACCESS_PASSWORD || "murano-local-demo-session";
}

function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function sign(value: string) { return createHmac("sha256", sessionSecret()).update(value).digest("base64url"); }

export function demoMode() { return process.env.NODE_ENV !== "production" && !process.env.MURANO_ACCESS_PASSWORD; }

export function createSession(name = "Thiago") {
  const raw = randomBytes(32).toString("base64url");
  const token = `${raw}.${sign(raw)}`;
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  db.prepare("INSERT INTO sessions(token_hash,user_name,role,expires) VALUES(?,?,?,?)")
    .run(hashToken(raw), name, "admin", expires);
  return { token, expires };
}

export function sessionCookie(token: string, expires: number) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expires).toUTCString()}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function currentUser(request: NextRequest): { name: string; role: "admin" } | null {
  if (demoMode()) return { name: "Thiago", role: "admin" };
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const [raw, signature] = token.split(".");
  if (!raw || !signature) return null;
  const expected = Buffer.from(sign(raw));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  const row = db.prepare("SELECT user_name,role,expires FROM sessions WHERE token_hash=?").get(hashToken(raw)) as { user_name: string; role: "admin"; expires: number } | undefined;
  if (!row || row.expires < Date.now()) return null;
  return { name: row.user_name, role: row.role };
}

export function validPassword(value: string) {
  const configured = process.env.MURANO_ACCESS_PASSWORD || "";
  if (!configured) return demoMode();
  const left = Buffer.from(value);
  const right = Buffer.from(configured);
  return left.length === right.length && timingSafeEqual(left, right);
}
