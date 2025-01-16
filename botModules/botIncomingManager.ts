import { MyContext } from "../bot.ts";
import { createCoursesSelectionKeyboard } from "../botStatic/keyboard.ts";
import { botAddCourseExecute} from "./botCoursesManager.ts";
import { updateTemporaryUser } from "../DB/temporaryUserDB.ts";
import {
  botReviseHomeworkExecute,
  botStudentSendHomeworkExecute,
} from "./botHomeWork.ts";
import { botRegistrationExecute } from "./botRegistration.ts";
import { setCoursePriceExecute } from "./botPaymentManager.ts";

export async function botTextProcessing(ctx: MyContext) {
  if (!ctx.message?.text) {
    console.log("Error botTextProcessing: No message text provided");
    return;
  }
  if (!ctx.from?.id) {
    console.log("Error botTextProcessing: No user ID provided");
    return;
  }

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
    await ctx.reply("Напишите дату рождения учащегося в формате YYYY-MM-DD \n" +
    "Например если дата рождения 31 февраля 2001 года, то напишите 2001-02-28");
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
    const { keyboard, isEmpty } = await createCoursesSelectionKeyboard(false);
    if (isEmpty) {
      await ctx.reply("Сейчас открытых курсов нет, следите за новостями в нашей группе. \n" +
      "https://t.me/math_pml");
    } else {
      await ctx.reply("Выберете курс для учащегося", {
        reply_markup: keyboard,
      });
    }
  } else if (ctx.session.stage === "addCourse") {
    await botAddCourseExecute(ctx);
    ctx.session.stage = "null";
  } else if (ctx.session.stage === "commentToHomework") {
    await botReviseHomeworkExecute(ctx);
    ctx.session.stage = "null";
  } else if (ctx.session.stage === "setCoursePrice") {
    await setCoursePriceExecute(ctx, ctx.message.text);
    ctx.session.stage = "null";
  } else {
    await ctx.reply("Введите команду /start для начала.");
  }
}

export async function botPhotoProcessing(ctx: MyContext) {
  if (ctx.session.stage === "paymentProcess") {
    await botRegistrationExecute(ctx);
    ctx.session.stage = "null";
  } else if (ctx.session.stage === "sendHomework") {
    await botStudentSendHomeworkExecute(ctx);
    ctx.session.stage = "null";
  }
}
