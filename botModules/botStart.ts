import { MyContext } from "../bot.ts";
import {
  getUserPaymentInProcess,
  isActiveStudent,
  userExists,
} from "../DB/mainDB.ts";
import {
  adminKeyboard,
  memberKeyboard,
  registrationKeyboard,
  studentKeyboard,
} from "../botStatic/keyboard.ts";
import { ADMIN_ID } from "../config.ts";
import { getRandomCompliment } from "../botStatic/compliment.ts";
import {
  deleteTemporaryUser,
  hasTemporaryRegistration,
} from "../DB/temporaryUserDB.ts";
import { exportKVToSheet } from "../googleSheets/sheetsCore.ts";

export async function botStart(ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    console.log("Error botStart: No user ID provided");
    return;
  }
  const ifUserExists = await userExists(userId);

  if (userId) {
    const userIsStudent = await isActiveStudent(userId);
    const userIsTemporary = await hasTemporaryRegistration(userId);
    const hasPaymentInProcess = await getUserPaymentInProcess(userId);

    if (userId === Number(ADMIN_ID)) {
      await ctx.reply(
        `Добро пожаловать Виктория! Помни, что ${getRandomCompliment()}`,
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

    if (userIsStudent === true) {
      await ctx.reply("Добро пожаловать! Выберите действие:", {
        reply_markup: studentKeyboard,
      });
      return;
    }

    if (ifUserExists === true) {
      await ctx.reply("Добро пожаловать. Сейчас у вас нет активных курсов.", {
        reply_markup: memberKeyboard,
      });
      return;
    }

    if (userIsStudent === false) {
      await ctx.reply("Пожалуйста, пройдите регистрацию.", {
        reply_markup: registrationKeyboard,
      });
      return;
    }
  }
}

// const message =
//       "Возникли сложности с оплатой, пожалуйста, напишите <a href='https://t.me/Bodhisattva_vi'>Виктории</a> напрямую.";

//     await ctx.api.sendMessage(userId, message, { parse_mode: "HTML" });


export async function botExportDB(ctx: MyContext) {
  const processingMessage = await ctx.reply("Выгружаю данные в Google Sheets, пожалуйста подождите...");
  
  const result = await exportKVToSheet();
  
  if (result.success) {
    await ctx.api.editMessageText( 
      processingMessage.chat.id,
      processingMessage.message_id,
      "База данных экспортирована в Google Sheets. \n" +
        "Ссылка: <a href='https://docs.google.com/spreadsheets/d/1y9-ZEaRBF66Kn1Ei5zJGiKDOwrWXNFxAxMRMyFKGMe0/edit?usp=sharing'>ТЫЦ</a>",
      {
        parse_mode: "HTML",
        reply_markup: adminKeyboard,
      }
    );
  } else {
    await ctx.api.editMessageText(
      processingMessage.chat.id,
      processingMessage.message_id,
      `Ошибка при экспорте базы данных: ${result.error}`,
      {
        reply_markup: adminKeyboard,
      }
    );
  }
}
