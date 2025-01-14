import { InlineKeyboard } from "@grammyjs/bot";
import { getKv } from "./kvClient.ts";
import { UserData } from "../DB/mainDB.ts";
import { getCourseNames } from "../DB/courseManagerDB.ts";
import { MyContext } from "../bot.ts";
import { getRandomCompliment } from "./compliment.ts";

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
  .text("Управление курсами", "manageCourses")
  .row()
  .text("Админский раздел", "adminZone");

export const courseKeyboard = new InlineKeyboard()
  .text("Добавить курс", "addCourse")
  .row()
  .text("Список курсов/удаление", "listCourses")
  .row()
  .text("Назад", "backToAdminMain");

export async function createPaymentConfirmationKeyboard(): Promise<{
  keyboard: InlineKeyboard;
  isEmpty: boolean;
}> {
  const kv = await getKv();
  const result = await kv.get<number[]>([
    "ViBot",
    "paymentConfirmationRequests",
  ]);
  const requestsList = result.value || [];

  const keyboard = new InlineKeyboard();

  if (requestsList.length === 0) {
    return { keyboard: keyboard, isEmpty: true };
  }

  for await (const userId of requestsList) {
    const userData = await kv.get<UserData>(["ViBot", "userId:", userId]);
    if (userData.value) {
      const userName = userData.value.nickName || "Нет username";
      const name = userData.value.name || "Нет имени";
      const buttonText = `ID: ${userId} | @${userName} | ${name}`;
      keyboard.text(buttonText, `confirm_payment:${userId}`).row();
    }
  }

  return { keyboard: keyboard, isEmpty: false };
}

export async function createCoursesSelectionKeyboard(): Promise<{
  keyboard: InlineKeyboard;
  isEmpty: boolean;
}> {
  const courses = await getCourseNames();

  const keyboard = new InlineKeyboard();

  if (courses.length === 0) {
    return { keyboard: keyboard, isEmpty: true };
  }

  for (const course of courses) {
    keyboard.text(course, `select_course:${course}`).row();
  }

  keyboard.text("Назад", "backToAdminMain").row();

  return { keyboard: keyboard, isEmpty: false };
}

export async function backToAdminMain(ctx: MyContext) {
  await ctx.editMessageText(`Привет! Помни что ${getRandomCompliment()}`);
  await ctx.editMessageReplyMarkup({ reply_markup: adminKeyboard });
}
