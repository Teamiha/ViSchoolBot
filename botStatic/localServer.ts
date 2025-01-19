import { saveAdminOAuthTokens } from "../googleSheets/sheetsDB.ts";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config.ts";
import { OAuthTokens } from "../googleSheets/sheetsDB.ts";

const REDIRECT_URI = "http://localhost:8000/oauth2callback";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);

    if (url.pathname === "/oauth2callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state"); // Ожидаем "admin"

      if (code && state === "admin") {
        try {
          if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            throw new Error("Missing Google OAuth credentials");
          }
          
          const params = new URLSearchParams();
          params.append("code", code);
          params.append("client_id", GOOGLE_CLIENT_ID);
          params.append("client_secret", GOOGLE_CLIENT_SECRET);
          params.append("redirect_uri", REDIRECT_URI);
          params.append("grant_type", "authorization_code");

          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });

          console.log("Параметры запроса:", params.toString());
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка при обмене кода на токены:", errorText);
            console.error("Статус ответа:", response.status);
            console.error("Заголовки ответа:", Object.fromEntries(response.headers));
            return new Response("Ошибка авторизации.", { status: 500 });
          }

          const tokens: OAuthTokens = await response.json();
          await saveAdminOAuthTokens(tokens);

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

    return new Response("OK");
  } catch (err) {
    console.error("❌ Error processing request:", err);
    return new Response("Error", { status: 500 });
  }
});