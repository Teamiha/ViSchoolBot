import { InlineKeyboard } from "@grammyjs/bot";
import { getKv } from "./kvClient.ts";
import { UserData } from "../DB/mainDB.ts";
import { getCourseNames, getCourses } from "../DB/courseManagerDB.ts";
import { MyContext } from "../bot.ts";
import { getRandomCompliment } from "./compliment.ts";
import { getUncheckedHomeworks } from "../DB/homeworkManagerDB.ts";

export async function backToAdminMain(ctx: MyContext) {
  await ctx.editMessageText(`Привет! Помни что ${getRandomCompliment()}`);
  await ctx.editMessageReplyMarkup({ reply_markup: adminKeyboard });
}

export const backButton = new InlineKeyboard()
  .text("Назад", "backToAdminMain");

export const registrationKeyboard = new InlineKeyboard()
  .text("Регистрация", "startRegistration")
  .row()
  .text("О боте", "aboutBot");

export const studentKeyboard = new InlineKeyboard()
  .text("Сдать домашнее задание", "sendHomework")
  .row()
  .text("Обновить личные данные", "updateStudentData")
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

export const courseKeyboard = new InlineKeyboard()
  .text("Добавить курс", "addCourse")
  .row()
  .text("Список курсов/удаление", "listCourses")
  .row()
  .text("Завершить курс", "completeCourse")
  .row()
  .text("Установить цену на курсы", "setCoursePrice")
  .row()
  .text("Назад", "backToAdminMain");

export const memberKeyboard = new InlineKeyboard()
  .text("Посмотреть доступные курсы", "viewCourses")
  .row()
  .text("Обновить личные данные", "updateStudentData")
  .row()
  .text("О боте", "aboutBot");

export const updateDataKeyboard = new InlineKeyboard()
  .text("Изменить школу", "update:school")
  .row()
  .text("Изменить класс", "update:class")
  .row()
  .text("Изменить кто регистрировал", "update:hwoRegistered")
  .row()
  .text("Назад", "backToStudent");

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

export async function createCoursesSelectionKeyboard(
  isAdmin: boolean = false,
): Promise<{
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

  if (isAdmin) {
    keyboard.text("Назад", "backToAdminMain").row();
  }

  return { keyboard: keyboard, isEmpty: false };
}

export async function createHomeworkCheckKeyboard(): Promise<{
  keyboard: InlineKeyboard;
  isEmpty: boolean;
}> {
  const kv = await getKv();
  const homeworks = await getUncheckedHomeworks();

  const keyboard = new InlineKeyboard();

  if (homeworks.length === 0) {
    return { keyboard: keyboard, isEmpty: true };
  }

  for (const homework of homeworks) {
    const userData = await kv.get<UserData>([
      "ViBot",
      "userId:",
      homework.studentId,
    ]);
    if (userData.value) {
      const studentName = userData.value.name || "Неизвестный ученик";
      const buttonText = `${studentName} | ${homework.courseName}`;
      keyboard.text(
        buttonText,
        `select_homework:${homework.studentId}:${homework.courseName}`,
      ).row();
    }
  }

  keyboard.text("Назад", "backToAdminMain").row();

  return { keyboard: keyboard, isEmpty: false };
}

export const homeworkResponseKeyboard = (
  studentId: string,
  courseName: string,
) =>
  new InlineKeyboard()
    .text("Принять", `accept_homework:${studentId}:${courseName}`)
    .row()
    .text("На доработку", `revise_homework:${studentId}:${courseName}`)
    .row()
    .text("Назад", "backToAdminMain");

export async function createCourseCompletionKeyboard(): Promise<{
  keyboard: InlineKeyboard;
  isEmpty: boolean;
}> {
  const courses = await getCourses();
  const keyboard = new InlineKeyboard();

  if (courses.length === 0) {
    return { keyboard: keyboard, isEmpty: true };
  }

  for (const course of courses) {
    keyboard.text(
      `Завершить курс: ${course.name}`,
      `complete_course:${course.name}`,
    ).row();
  }

  keyboard.text("Назад", "backToAdminMain").row();

  return { keyboard: keyboard, isEmpty: false };
}
