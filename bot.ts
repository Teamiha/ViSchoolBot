import { Bot, Context, session, SessionFlavor } from "@grammyjs/bot";
import { limit } from "@grammyjs/ratelimiter";
import { BOT_TOKEN } from "./config.ts";
import { botStart, botExportDB } from "./botModules/botStart.ts";
import { adminKeyboard, backToAdminMain } from "./botStatic/keyboard.ts";
import {
  botHandleUpdateField,
  botRegistration,
  botSelfUnsubscribeExecute,
  botUpdateStudentData,
} from "./botModules/botRegistration.ts";
import {
  botCancelConfirmation,
  botCheckPayments,
  botConfirmPayment,
  botFinalConfirmPayment,
  botPaymentProblems,
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
import { botAbout } from "./botModules/botAbout.ts";
import {
  botManageStudents,
  botDeleteStudentFromActive,
  botDeleteStudentFromActiveExecute,
} from "./botModules/botStudentManager.ts";
import { exportKVToSheet } from "./googleSheets/sheetsCore.ts";


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
  timeFrame: 1000,
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

bot.callbackQuery("aboutBot", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botAbout(ctx);
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

bot.callbackQuery("manageStudents", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botManageStudents(ctx);
});

bot.callbackQuery("deleteStudentFromCourse", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botDeleteStudentFromActive(ctx);
});

bot.callbackQuery("exportDB", async (ctx) => {
  await ctx.answerCallbackQuery();
  await botExportDB(ctx);
});

// bot.callbackQuery("endLearning", async (ctx) => {
//   await ctx.answerCallbackQuery();
//   await botSelfUnsubscribe(ctx);
// });

bot.callbackQuery(/^delete_student_from_course:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botDeleteStudentFromActiveExecute(ctx);
});

bot.callbackQuery(/^self_unsubscribe:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botSelfUnsubscribeExecute(ctx);
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

bot.callbackQuery(/^payment_problems:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await botPaymentProblems(ctx);
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

// bot.start();

export { bot };
