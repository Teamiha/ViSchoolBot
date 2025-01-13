import { Bot, Context, session, SessionFlavor } from "@grammyjs/bot";
import { BOT_TOKEN } from "./config.ts";
import { botStart } from "./botModules/botStart.ts";
import { adminKeyboard } from "./botStatic/keyboard.ts";
import { botRegistration, botChoseCourse } from "./botModules/botRegistration.ts";
import {
  botCheckPayments,
  botConfirmPayment,
  botFinalConfirmPayment,
} from "./botModules/botPaymentManager.ts";
import {
  botPhotoProcessing,
  botTextProcessing,
} from "./botModules/botIncomingManager.ts";

export interface SessionData {
  stage:
    | "null"
    | "askWhoRegistered"
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
  await botRegistration(ctx);
});

bot.callbackQuery("checkPayments", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCheckPayments(ctx);
});

bot.callbackQuery(/^confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botConfirmPayment(ctx);
});

bot.callbackQuery(/^final_confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botFinalConfirmPayment(ctx);
});

// В файле с обработчиками
bot.callbackQuery(/^select_course:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await botChoseCourse(ctx);
  });

bot.callbackQuery("cancel_confirmation", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Действие отменено", { reply_markup: adminKeyboard });
});

bot.on("message:text", async (ctx) => {
  await botTextProcessing(ctx);
});

bot.on("message:photo", async (ctx) => {
  await botPhotoProcessing(ctx);
});

bot.start();
