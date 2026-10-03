import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataDir, get, put, remove } from "./db";

const keyPath = path.join(dataDir, "encryption.key");
const envMap: Record<string, string> = {
  openrouter: "OPENROUTER_API_KEY",
  googleClientId: "GOOGLE_CLIENT_ID",
  googleClientSecret: "GOOGLE_CLIENT_SECRET",
  googleDestinationRefresh: "GOOGLE_DESTINATION_REFRESH_TOKEN",
  googleSourceRefresh: "GOOGLE_SOURCE_REFRESH_TOKEN",
};

function encryptionKey() {
  try {
    return readFileSync(keyPath);
  } catch {
    try { writeFileSync(keyPath, randomBytes(32), { mode: 0o600, flag: "wx" }); } catch { /* another process created it */ }
    return readFileSync(keyPath);
  }
}

export function setSecret(name: string, value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  put("secret", name, Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64"));
}

export function secret(name: string): string {
  const saved = get<string>("secret", name);
  if (!saved) return process.env[envMap[name]] || "";
  const bytes = Buffer.from(saved, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}

export function deleteSecret(name: string) { remove("secret", name); }
export function appUrl() { return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""); }
export function aiModel() { return process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini"; }
