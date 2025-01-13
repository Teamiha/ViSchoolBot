import {
  Bot,
  Context,
  InlineKeyboard,
  session,
  SessionFlavor,
} from "@grammyjs/bot";
import { BOT_TOKEN } from "./config.ts";
import { botStart } from "./botModules/botStart.ts";
import {
  addPaymentConfirmationRequest,
  confirmRegistration,
  createTemporaryUser,
  updateTemporaryUser,
  updateUser,
  removePaymentConfirmationRequest,
} from "./db.ts";
import {
  adminKeyboard,
  createPaymentConfirmationKeyboard,
} from "./botStatic/keyboard.ts";


export interface SessionData {
  stage:
    | "null"
    | "askHwoRegistered"
    | "askName"
    | "askBirthDate"
    | "askSchool"
    | "askClass"
    | "askCourses"
    | "paymentProcess"
    | "askNotes"
    | "sendHomework"
    | "askQuestion"
    | "makeNotes";
}

export type MyContext = Context & SessionFlavor<SessionData>;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined");
}

const bot = new Bot<MyContext>(BOT_TOKEN);

bot.use(session({
  initial: (): SessionData => ({
    stage: "null",
  }),
}));

bot.command("start", async (ctx) => {
  ctx.session.stage = "null";
  await botStart(ctx);
});

bot.callbackQuery("startRegistration", async (ctx) => {
  await ctx.answerCallbackQuery();
  await createTemporaryUser(ctx.from?.id);
  if (ctx.from?.username) {
    await updateTemporaryUser(ctx.from?.id, "nickName", ctx.from?.username);
  }
  ctx.session.stage = "askName";
  await ctx.reply(
    "Начат процесс регистрации.\n" +
      "Пожалуйста, введите все данные и проведите оплату за обучение в течении 30 минут.\n" +
      "Если не успеете, то придется пройти регистрацию заново.\n\n" +
      "Напишите имя учащегося:",
  );
});

bot.callbackQuery("checkPayments", async (ctx) => {
  const { keyboard, isEmpty } = await createPaymentConfirmationKeyboard();
  
  if (isEmpty) {
    await ctx.reply("На данный момент нет пользователей, ожидающих подтверждения оплаты.");
    return;
  }

  await ctx.reply("Список пользователей, ожидающих подтверждения оплаты:", {
    reply_markup: keyboard,
  });
});

bot.callbackQuery(/^confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = Number(ctx.match[1]);

  // Здесь можно добавить дополнительное подтверждение
  await ctx.reply(
    `Вы уверены, что хотите подтвердить оплату для пользователя ${userId}?`,
    {
      reply_markup: new InlineKeyboard()
        .text("Да", `final_confirm_payment:${userId}`)
        .text("Нет", "cancel_confirmation"),
    },
  );
});

bot.callbackQuery(/^final_confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = Number(ctx.match[1]);
  await updateUser(userId, "paymentInProcess", false);
  await removePaymentConfirmationRequest(userId);
  await ctx.reply("Оплата подтверждена!", { reply_markup: adminKeyboard });
});

bot.callbackQuery("cancel_confirmation", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Действие отменено", { reply_markup: adminKeyboard });
});

bot.on("message:text", async (ctx) => {
  if (ctx.session.stage === "askName") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "name", messageText);
    ctx.session.stage = "askHwoRegistered";
    await ctx.reply(`Выберите кто регистрируется, родитель или сам учащийся.
              `);
  } else if (ctx.session.stage === "askHwoRegistered") {
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
    await ctx.reply("Напишите на какой курс записывается учащийся");
  } else if (ctx.session.stage === "askCourses") {
    const messageText = ctx.message.text;
    await updateTemporaryUser(ctx.from?.id, "courses", messageText);
    ctx.session.stage = "paymentProcess";
    await ctx.reply(
      "Пожалуйста, отправьте фото с квитанцией оплаты (!!! ВСТАВИТЬ МЕТОДЫ ОПЛАТЫ!!!)",
    );
  } else {
    await ctx.reply("Введите команду /start для начала.");
  }
});

bot.on("message:photo", async (ctx) => {
  if (ctx.session.stage === "null") {
    console.log("Отправлено фото");
  } else if (ctx.session.stage === "paymentProcess") {
    const caption = ctx.message.caption;

    ctx.session.stage = "null";
    await confirmRegistration(ctx.from?.id);
    await addPaymentConfirmationRequest(ctx.from?.id);
    await updateUser(ctx.from?.id, "paymentInProcess", true);
    await ctx.reply(
      "Спасибо! После подтверждения оплаты, вам прийдет сообщение о завершении регистрации.",
    );
  }
});

bot.start();


