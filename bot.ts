import { Bot, Context, session, SessionFlavor } from "@grammyjs/bot";
import { BOT_TOKEN } from "./config.ts";

export interface SessionData {
  stage:
    | "null"
    | "startRegistration"
    | "askHwoRegistered"
    | "askName"
    | "askBirthDate"
    | "askSchool"
    | "askClass"
    | "askCourses"
    | "askNotes"
    | "sendHomework"
    | "makeNotes";
}

export type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(BOT_TOKEN);

bot.use(session({
  initial: (): SessionData => ({
    stage: "null",
  }),
}));

bot.command("start", (ctx) => {
  ctx.session.stage = "null";
  ctx.reply(
    "Привет! Я бот для управления задачами. Чтобы начать, отправь мне сообщение.",
  );
});

bot.start();
