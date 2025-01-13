import { InlineKeyboard } from "@grammyjs/bot";
import { getKv } from "./kvClient.ts";
import { UserData } from "../db.ts";

export const registrationKeyboard = new InlineKeyboard()
  .text("Регистрация", "startRegistration")
  .row()
  .text("О боте", "aboutBot");

export const studentKeyboard = new InlineKeyboard()
  .text("Сдать домашнее задание", "sendHomework")
  .row()
  .text("Повторно получить приглашение в группу", "groupInvite")
  .row()
  .text("Завершить обучение", "endLearning");

export const adminKeyboard = new InlineKeyboard()
  .text("Выгрузка базы данных", "exportDB")
  .row()
  .text("Подтвердить оплату", "checkPayments")
  .row()
  .text("Проверить домашние задания", "checkHomework")
  .row()
  .text("Заблокировать пользователя", "blockUser")
  .row()
  .text("Админский раздел", "adminZone");

export async function createPaymentConfirmationKeyboard(): Promise<
  InlineKeyboard
> {
  const kv = await getKv();
  const result = await kv.get<number[]>([
    "ViBot",
    "paymentConfirmationRequests",
  ]);
  const requestsList = result.value || [];

  const keyboard = new InlineKeyboard();

  for await (const userId of requestsList) {
    const userData = await kv.get<UserData>(["ViBot", "userId:", userId]);
    if (userData.value) {
      const userName = userData.value.nickName || "Нет username";
      const name = userData.value.name || "Нет имени";
      const buttonText = `ID: ${userId} | @${userName} | ${name}`;
      keyboard.text(buttonText, `confirm_payment:${userId}`).row();
    }
  }

  return keyboard;
}
