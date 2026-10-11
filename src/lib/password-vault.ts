import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function vaultKey(): Buffer {
  const hex = process.env.PASSWORD_VAULT_KEY;
  if (!hex || !/^[a-f0-9]{64}$/i.test(hex)) {
    throw new Error("PASSWORD_VAULT_KEY must be configured as 64 hex characters");
  }
  return Buffer.from(hex, "hex");
}

export function encryptPassword(password: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return {
    encrypted_password: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    auth_tag: cipher.getAuthTag().toString("base64"),
    algorithm: "aes-256-gcm",
  };
}

export function decryptPassword(record: { encrypted_password: string; iv: string; auth_tag: string }) {
  const decipher = createDecipheriv("aes-256-gcm", vaultKey(), Buffer.from(record.iv, "base64"));
  decipher.setAuthTag(Buffer.from(record.auth_tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(record.encrypted_password, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
