import { webhookCallback } from "@grammyjs/bot";
import { bot } from "./bot.ts";
import { saveAdminOAuthTokens } from "./googleSheets/sheetsDB.ts";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
  BOT_TOKEN
} from "./config.ts";
import { OAuthTokens } from "./googleSheets/sheetsDB.ts";

// const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
// if (!BOT_TOKEN) {
//   throw new Error("BOT_TOKEN is not set");
// }

const handleUpdate = webhookCallback(bot, "std/http", {
  timeoutMilliseconds: 30000,
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    console.log("Incoming request path:", url.pathname);
    const incomingPath = url.pathname.slice(1);

    if (url.pathname === "/oauth2callback") {
      console.log("OAuth callback hit");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      
      console.log("OAuth params:", {
        hasCode: !!code,
        codePreview: code ? `${code.substring(0, 10)}...` : null,
        state,
        clientId: GOOGLE_CLIENT_ID,
        redirectUri: REDIRECT_URI,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET
      });
      
      if (code && state === "admin") {
        try {
          const params = new URLSearchParams();
          params.append("code", code);
          params.append("client_id", GOOGLE_CLIENT_ID);
          params.append("client_secret", GOOGLE_CLIENT_SECRET);
          params.append("redirect_uri", REDIRECT_URI);
          params.append("grant_type", "authorization_code");

          console.log("Request params:", params.toString());

          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Token exchange error details:", {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers),
              error: errorText
            });
            return new Response(
              `Ошибка авторизации: ${response.status} ${errorText}`, 
              { status: 500 }
            );
          }

          const tokens: OAuthTokens = await response.json();
          await saveAdminOAuthTokens(tokens);

          // Отправка простого HTML ответа
          return new Response(
            "Авторизация прошла успешно! Можете закрыть это окно.",
            { status: 200, headers: { "Content-Type": "text/html" } },
          );
        } catch (error) {
          console.error("Ошибка при обработке OAuth callback:", error);
          return new Response("Ошибка авторизации.", { status: 500 });
        }
      } else {
        return new Response("Неверные параметры авторизации.", { status: 400 });
      }
    }

    if (
      req.method === "POST" && (
        incomingPath === BOT_TOKEN ||
        incomingPath.startsWith(BOT_TOKEN)
      )
    ) {
      return await handleUpdate(req);
    }

    console.log("⚠️ Unhandled request path");
    return new Response("OK");
  } catch (err) {
    console.error("❌ Error processing request:", err);
    return new Response("Error", { status: 500 });
  }
});

