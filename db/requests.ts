import { env } from "cloudflare:workers";
export function requestDb() {
  if (!env.DB) throw new Error("Request storage unavailable");
  return env.DB;
}
