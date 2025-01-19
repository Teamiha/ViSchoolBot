// export const VIID = 454029119;
// export const ADMIN_ID = 454029119;

// export const SVETLOVID = 526827458;
export const ADMIN_ID = 526827458;

// export const SVETLOVID = 5268274;

import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();

export const GOOGLE_SHEET_ID = "1y9-ZEaRBF66Kn1Ei5zJGiKDOwrWXNFxAxMRMyFKGMe0";

const BOT_TOKEN = env["BOT_TOKEN"] || Deno.env.get("BOT_TOKEN");
const GOOGLE_KEY = env["GOOGLE_KEY"] || Deno.env.get("GOOGLE_KEY");
const GOOGLE_CLIENT_ID = env["GOOGLE_CLIENT_ID"] || Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = env["GOOGLE_CLIENT_SECRET"] || Deno.env.get("GOOGLE_CLIENT_SECRET");

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined in environment variables");
}

export { BOT_TOKEN, GOOGLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET };
