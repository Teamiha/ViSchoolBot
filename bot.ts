import { Bot, Context, session, SessionFlavor } from "@grammyjs/bot";
import { BOT_TOKEN } from "./config.ts";
import { botStart } from "./botModules/botStart.ts";
import { adminKeyboard, backToAdminMain } from "./botStatic/keyboard.ts";
import { botRegistration } from "./botModules/botRegistration.ts";
import {
  botCheckPayments,
  botConfirmPayment,
  botFinalConfirmPayment,
} from "./botModules/botPaymentManager.ts";
import {
  botPhotoProcessing,
  botTextProcessing,
} from "./botModules/botIncomingManager.ts";
import {
  botAddCourseStart,
  botChoseCourse,
  botCourseList,
  botCourseManager,
} from "./botModules/botCoursesManager.ts";
import {
  botCheckHomework,
  botReviseHomework,
  botSelectHomework,
} from "./botModules/botHomeWork.ts";

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
    | "addCourse"
    | "askNotes"
    | "sendHomework"
    | "commentToHomework"
    | "askQuestion"
    | "makeNotes";
  homeworkData?: {
    studentId: string;
    courseName: string;
  };
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

bot.callbackQuery("addCourse", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botAddCourseStart(ctx);
});

bot.callbackQuery("checkPayments", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCheckPayments(ctx);
});

bot.callbackQuery("manageCourses", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCourseManager(ctx);
});

bot.callbackQuery("backToAdminMain", async (ctx) => {
  await ctx.answerCallbackQuery();
  await backToAdminMain(ctx);
});

bot.callbackQuery("listCourses", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCourseList(ctx);
});

bot.callbackQuery("checkHomework", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCheckHomework(ctx);
});

bot.callbackQuery(/^confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botConfirmPayment(ctx);
});

bot.callbackQuery(/^final_confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botFinalConfirmPayment(ctx);
});

bot.callbackQuery(/^select_course:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botChoseCourse(ctx);
});

bot.callbackQuery(/^select_homework:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botSelectHomework(ctx);
});

bot.callbackQuery(/^revise_homework:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botReviseHomework(ctx);
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
