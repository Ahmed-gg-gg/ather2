import { cookies } from "next/headers";
import type { Lang } from "./dictionary";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get("athar_lang")?.value;
  return value === "en" ? "en" : "ar";
}
