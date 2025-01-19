import { Bot } from "@grammyjs/bot";
import { GOOGLE_SHEET_ID } from "../config.ts";
import { getAdminOAuthTokens } from "./sheetsDB.ts";
import { getKv } from "../botStatic/kvClient.ts";

// Функция для очистки таблицы
async function clearSheet(accessToken: string, sheetId: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z10000:clear`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to clear sheet: ${response.statusText}`);
  }
}

// Функция для записи данных в таблицу
async function writeToSheet(accessToken: string, sheetId: string, values: any[][]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z${values.length}?valueInputOption=RAW`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: values
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to write to sheet: ${response.statusText}`);
  }
}

// Основная функция экспорта
export async function exportKVToSheet(): Promise<{ success: boolean; error?: string }> {
  try {
    // Получаем токены
    const tokens = await getAdminOAuthTokens();
    if (!tokens?.access_token) {
      return { success: false, error: "Токены авторизации недоступны" };
    }

    // Получаем все записи с префиксом ViBot
    const kv = await getKv();
    const entries = kv.list({ prefix: ["ViBot"] });
    
    // Подготавливаем данные для записи
    const data: any[][] = [["Key", "Value"]];

    for await (const entry of entries) {
      const keyString = entry.key.join(':');
      const valueString = JSON.stringify(entry.value, null, 2);
      data.push([keyString, valueString]);
    }

    // Очищаем существующие данные
    await clearSheet(tokens.access_token, GOOGLE_SHEET_ID);

    // Записываем новые данные
    await writeToSheet(tokens.access_token, GOOGLE_SHEET_ID, data);

    return { success: true };
  } catch (error) {
    console.error("Error exporting data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Неизвестная ошибка" 
    };
  }
}

