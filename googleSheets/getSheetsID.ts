import { getAdminOAuthTokensRemoute } from "../admin.ts";

export interface Spreadsheet {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  // Другие поля по необходимости
}

export async function listAllSpreadsheets(): Promise<Spreadsheet[]> {
  const tokens = await getAdminOAuthTokensRemoute();
  if (!tokens || !tokens.access_token) {
    throw new Error("OAuth токены админа недоступны.");
  }

  const url = "https://www.googleapis.com/drive/v3/files";
  const params = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: "files(id,name,createdTime,modifiedTime)",
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        "Authorization": `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ошибка при получении списка таблиц:", errorText);
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const data = await response.json();

    const spreadsheets: Spreadsheet[] = data.files.map((item: any) => ({
      id: item.id,
      name: item.name,
      createdTime: item.createdTime,
      modifiedTime: item.modifiedTime,
    }));

    return spreadsheets;
  } catch (error) {
    console.error("Ошибка при обращении к Google Sheets API:", error);
    throw error;
  }
}

async function getSheetsID() {
  try {
    const spreadsheets = await listAllSpreadsheets();
    spreadsheets.forEach((sheet) => {
      console.log(`Название: ${sheet.name}, ID: ${sheet.id}`);
    });
  } catch (error) {
    console.error("Не удалось получить список таблиц:", error);
  }
}

getSheetsID();
