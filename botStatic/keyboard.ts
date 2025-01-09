import { InlineKeyboard } from "@grammyjs/bot";

export const newUserKeyboard = new InlineKeyboard()
  .text("Перейти к оплате", "startRegistration")
  .row()
  .text("О боте", "aboutBot");

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
  .text("Проверить домашние задания", "checkHomework")
  .row()
  .text("Заблокировать пользователя", "blockUser")
  .row()
  .text("Админский раздел", "adminZone");
