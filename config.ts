export const BOT_TOKEN = Deno.env.get("BOT_TOKEN") || "";
export const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
export const REDIRECT_URI = Deno.env.get("REDIRECT_URI") ||
  "https://yourdomain.com/oauth2callback";

export const ADMIN_ID = 454029119;

export const GOOGLE_SHEET_ID = "1y9-ZEaRBF66Kn1Ei5zJGiKDOwrWXNFxAxMRMyFKGMe0";

export const GOOGLE_CLIENT_ID = "560125731996-01q2h00k2dcn5p6a1ur40q7n8l64ha9s.apps.googleusercontent.com";


if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is required");
  }

  if (!GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
  }

  if (!REDIRECT_URI) {
    throw new Error("REDIRECT_URI environment variable is required");
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth credentials");
  }
