import { MyContext } from "../bot.ts";
import { getUserParametr, isStudent } from "../db.ts";
import {
  adminKeyboard,
  registrationKeyboard,
  studentKeyboard,
} from "../botStatic/keyboard.ts";
import { SVETLOVID, VIID } from "../config.ts";
import { getRandomCompliment } from "../botStatic/compliment.ts";

export async function botStart(ctx: MyContext) {
  const userId = ctx.from?.id;
  const userName = ctx.from?.username;

  if (userId) {
    const userIsStudent = await isStudent(userId);

    if (userId === Number(VIID) || userId === Number(SVETLOVID)) {
      await ctx.reply(
        `Добро пожаловать Виктория! Помни что ${getRandomCompliment()}`,
        {
          reply_markup: adminKeyboard,
        },
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
