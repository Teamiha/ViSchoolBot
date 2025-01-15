import { MyContext } from "../bot.ts";
import { createCoursesSelectionKeyboard } from "../botStatic/keyboard.ts";
import { botAddCourseExecute } from "./botCoursesManager.ts";
import { updateTemporaryUser } from "../DB/temporaryUserDB.ts";
import {
  botReviseHomeworkExecute,
  botStudentSendHomeworkExecute,
} from "./botHomeWork.ts";
import { botRegistrationExecute } from "./botRegistration.ts";

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
    const { keyboard, isEmpty } = await createCoursesSelectionKeyboard(false);
    if (isEmpty) {
      await ctx.reply("Курсов нет, напишите администратору");
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
