export const VIID = 454029119;
export const SVETLOVID = 526827458;
export const ADMIN_ID = 526827458;

// export const SVETLOVID = 5268274;

import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();

const BOT_TOKEN = env["BOT_TOKEN"] || Deno.env.get("BOT_TOKEN");

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined in environment variables");
}

export { BOT_TOKEN };
