import { Bot, Context, session, SessionFlavor } from "@grammyjs/bot";
import { BOT_TOKEN } from "./config.ts";
import { botStart } from "./botModules/botStart.ts";
import { updateTemporaryUser } from "./db.ts";

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
    | "paymentProcess"
    | "askNotes"
    | "sendHomework"
    | "askQuestion"
    | "makeNotes";
}

export type MyContext = Context & SessionFlavor<SessionData>;

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
      await ctx.reply("Пожалуйста, отправьте фото с квитанцией оплаты (!!! ВСТАВИТЬ МЕТОДЫ ОПЛАТЫ!!!)");

    } else {
      await ctx.reply("Введите команду /start для начала.");
      }
  });





bot.on("message:photo", async (ctx) => {
    if (ctx.session.stage === "paymentProcess") {
  const caption = ctx.message.caption;
  
  console.log("Отправлено фото");
  ctx.session.stage = "null";
  await ctx.reply("Спасибо за регистрацию!");
}
});

bot.start();
