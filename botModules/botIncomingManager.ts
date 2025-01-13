import { MyContext } from "../bot.ts";
import {
  addPaymentConfirmationRequest,
  confirmRegistration,
  getUser,
  updateTemporaryUser,
  updateUser,
} from "../db.ts";
import { SVETLOVID } from "../config.ts";
import { createCoursesSelectionKeyboard } from "../botStatic/keyboard.ts";
import { botAddCourseExecute } from "./botCoursesManager.ts";
export async function botTextProcessing(ctx: MyContext) {
  if (!ctx.message?.text) return;
  if (!ctx.from?.id) return;

  if (ctx.session.stage === "askName") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "name", messageText);
    ctx.session.stage = "askWhoRegistered";
    await ctx.reply(`Выберите кто регистрируется, родитель или сам учащийся.
                  `);
  } else if (ctx.session.stage === "askWhoRegistered") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "hwoRegistered", messageText);
    ctx.session.stage = "askBirthDate";
    await ctx.reply("Напишите дату рождения учащегося");
  } else if (ctx.session.stage === "askBirthDate") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "birthday", messageText);
    ctx.session.stage = "askSchool";
    await ctx.reply("Напишите в какой школе учится учащийся");
  } else if (ctx.session.stage === "askSchool") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "school", messageText);
    ctx.session.stage = "askClass";
    await ctx.reply("Напишите в каком классе учится учащийся");
  } else if (ctx.session.stage === "askClass") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "class", messageText);
    ctx.session.stage = "askCourses";
    const { keyboard, isEmpty } = await createCoursesSelectionKeyboard();
    if (isEmpty) {
      await ctx.reply("Курсов нет, напишите администратору");
    } else {
      await ctx.reply("Выберете курс для учащегося", { reply_markup: keyboard });
    }
  } else if (ctx.session.stage === "addCourse") {
    await botAddCourseExecute(ctx);
    ctx.session.stage = "null";
  } else {
    await ctx.reply("Введите команду /start для начала.");
  }
}

export async function botPhotoProcessing(ctx: MyContext) {
  if (!ctx.from?.id) return;
  if (!ctx.message?.photo) return;
  if (!ctx.chat?.id) return;
  if (ctx.session.stage === "paymentProcess") {
    const userId = ctx.from?.id;

    ctx.session.stage = "null";
    await confirmRegistration(ctx.from?.id);
    await addPaymentConfirmationRequest(ctx.from?.id);
    await updateUser(ctx.from?.id, "paymentInProcess", true);

    // Получаем данные пользователя
    const userData = await getUser(userId);
    const userNickname = userData.value?.nickName || "Нет username";
    const userName = userData.value?.name || "Нет имени";

    // Пересылаем фото администратору
    await ctx.api.forwardMessage(
      SVETLOVID,
      ctx.chat.id,
      ctx.message.message_id,
    );

    // Отправляем сообщение администратору
    await ctx.api.sendMessage(
      SVETLOVID,
      `Ура! От пользователя (ID: ${userId}, @${userNickname}, ${userName}) пришла оплата.\n` +
        `Как проверишь, подтверди её факт в администраторском разделе "Подтвердить оплату".`,
    );

    await ctx.reply(
      "Спасибо! После подтверждения оплаты, вам прийдет сообщение о завершении регистрации.",
    );
  }
}
