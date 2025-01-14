import { MyContext } from "../bot.ts";
import { getUserPaymentInProcess, isActiveStudent } from "../DB/mainDB.ts";
import {
  adminKeyboard,
  registrationKeyboard,
  studentKeyboard,
} from "../botStatic/keyboard.ts";
import { SVETLOVID, VIID } from "../config.ts";
import { getRandomCompliment } from "../botStatic/compliment.ts";
import {
  deleteTemporaryUser,
  hasTemporaryRegistration,
} from "../DB/temporaryUserDB.ts";

export async function botStart(ctx: MyContext) {
  const userId = ctx.from?.id;

  if (userId) {
    const userIsStudent = await isActiveStudent(userId);
    const userIsTemporary = await hasTemporaryRegistration(userId);
    const hasPaymentInProcess = await getUserPaymentInProcess(userId);

    if (userId === Number(VIID) || userId === Number(SVETLOVID)) {
      await ctx.reply(
        `Добро пожаловать Виктория! Помни что ${getRandomCompliment()}`,
        {
          reply_markup: adminKeyboard,
        },
      );
      return;
    }

    if (userIsTemporary) {
      await deleteTemporaryUser(userId);
      await ctx.reply(
        "Видимо вы не завершили прошлую регистрацию.\n" +
          "Сожалеем, но вам придётся начать заново.",
        {
          reply_markup: registrationKeyboard,
        },
      );
      return;
    }

    if (hasPaymentInProcess) {
      await ctx.reply(
        "Пожалуйста, подождите, пока администратор подтвердит вашу оплату.",
      );
      return;
    }

    if (userIsStudent === false) {
      await ctx.reply("Пожалуйста, пройдите регистрацию.", {
        reply_markup: registrationKeyboard,
      });
      return;
    }

    if (userIsStudent === true) {
      await ctx.reply("Добро пожаловать! Выберите действие:", {
        reply_markup: studentKeyboard,
      });
    }
  }
}
