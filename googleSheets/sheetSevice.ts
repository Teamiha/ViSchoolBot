import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config.ts";
import { getAdminOAuthTokens, saveAdminOAuthTokens } from "./sheetsDB.ts";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  calendarId: string;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  const url = "https://oauth2.googleapis.com/token";

  const params = new URLSearchParams();
  params.append("client_id", GOOGLE_CLIENT_ID);
  params.append("client_secret", GOOGLE_CLIENT_SECRET);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Не удалось обновить access_token:", errorText);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in; // В секундах

    // Обновляем токены в Deno.KV
    const tokens = await getAdminOAuthTokens();
    if (tokens) {
      tokens.access_token = newAccessToken;
      if (expiresIn) {
        tokens.expiry_date = Date.now() + expiresIn * 1000;
      }
      await saveAdminOAuthTokens(tokens);
      console.log("Токены обновлены");
    }

    return newAccessToken;
  } catch (error) {
    console.error("Ошибка при обновлении access_token:", error);
    return null;
  }
}

export async function getCalendarEventsForNext24Hours(ID: string): Promise<
  GoogleCalendarEvent[]
> {
  const tokens = await getAdminOAuthTokens();
  console.log("Полученные токены");

  if (!tokens || !tokens.access_token) {
    throw new Error("OAuth токены админа недоступны.");
  }

  let accessToken = tokens.access_token;

  if (!tokens.expiry_date || Date.now() >= tokens.expiry_date) {
    console.log("Токен истек или отсутствует expiry_date, пытаемся обновить");
    if (tokens.refresh_token) {
      const refreshedToken = await refreshAccessToken(tokens.refresh_token);
      if (refreshedToken) {
        accessToken = refreshedToken;
        console.log("Токен успешно обновлен");
      } else {
        console.error("Не удалось обновить токен");
        throw new Error("Не удалось обновить access_token.");
      }
    } else {
      throw new Error(
        "Refresh token отсутствует. Требуется повторная авторизация.",
      );
    }
  }

  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + 24 * 60 * 60 * 1000);

  const timeMinISOString = timeMin.toISOString();
  const timeMaxISOString = timeMax.toISOString();

  const calendarId = ID;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${
    encodeURIComponent(calendarId)
  }/events?timeMin=${encodeURIComponent(timeMinISOString)}&timeMax=${
    encodeURIComponent(timeMaxISOString)
  }&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ошибка при получении событий календаря:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        requestUrl: url,
        tokenPreview: accessToken.substring(0, 10) + "...",
      });
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items as GoogleCalendarEvent[] || [];
  } catch (error) {
    console.error("Ошибка при обращении к Google Calendar API:", error);
    throw error;
  }
}
