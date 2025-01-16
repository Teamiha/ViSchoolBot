import { Bot, Context, session, SessionFlavor } from "@grammyjs/bot";
import { limit } from "@grammyjs/ratelimiter";
import { BOT_TOKEN } from "./config.ts";
import { botStart } from "./botModules/botStart.ts";
import { adminKeyboard, backToAdminMain } from "./botStatic/keyboard.ts";
import {
  botHandleUpdateField,
  botRegistration,
  botUpdateStudentData,
} from "./botModules/botRegistration.ts";
import {
  botCancelConfirmation,
  botCheckPayments,
  botConfirmPayment,
  botFinalConfirmPayment,
  setCoursePrice,
} from "./botModules/botPaymentManager.ts";
import {
  botPhotoProcessing,
  botTextProcessing,
} from "./botModules/botIncomingManager.ts";
import {
  botAddCourseStart,
  botChoseCourse,
  botCompleteCourse,
  botCompleteCourseExecute,
  botCourseList,
  botCourseManager,
  botViewCoursesForExistingUser,
} from "./botModules/botCoursesManager.ts";
import {
  botAcceptHomework,
  botCheckHomework,
  botReviseHomework,
  botSelectHomework,
  botStudentSendHomework,
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
    | "updateStudentData"
    | "commentToHomework"
    | "askQuestion"
    | "setCoursePrice"
    | "makeNotes";
  homeworkData?: {
    studentId: string;
    courseName: string;
  };
  updateField?: string;
}

export type MyContext = Context & SessionFlavor<SessionData>;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined");
}

const bot = new Bot<MyContext>(BOT_TOKEN);

bot.use(limit({
  timeFrame: 2000,
  limit: 1,
  onLimitExceeded: async (ctx) => {
    await ctx.reply("Пожалуйста, подождите немного перед следующим действием");
  },
}));

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

bot.callbackQuery("updateStudentData", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botUpdateStudentData(ctx);
});

bot.callbackQuery("backToStudent", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botStart(ctx);
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

bot.callbackQuery("sendHomework", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botStudentSendHomework(ctx);
});

bot.callbackQuery("setCoursePrice", async (ctx) => {
  await ctx.answerCallbackQuery();
  await setCoursePrice(ctx);
});

bot.callbackQuery("completeCourse", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCompleteCourse(ctx);
});

bot.callbackQuery("viewCourses", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botViewCoursesForExistingUser(ctx);
});

bot.callbackQuery(/^update:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botHandleUpdateField(ctx);
});

bot.callbackQuery(/^complete_course:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCompleteCourseExecute(ctx);
});

bot.callbackQuery(/^accept_homework:(\d+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botAcceptHomework(ctx);
});

bot.callbackQuery(/^confirm_payment:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botConfirmPayment(ctx);
});

bot.callbackQuery(/^cancel_confirmation:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botCancelConfirmation(ctx);
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
