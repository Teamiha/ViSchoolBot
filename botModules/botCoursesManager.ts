import { MyContext } from "../bot.ts";
import {
  addCourse,
  getCourseByName,
  removeCourse,
  completeCourse,
} from "../DB/courseManagerDB.ts";
import {
  courseKeyboard,
  createCoursesSelectionKeyboard,
  adminKeyboard,
} from "../botStatic/keyboard.ts";
import { SVETLOVID, VIID } from "../config.ts";
import { updateTemporaryUser } from "../DB/temporaryUserDB.ts";
import { getCoursePrice } from "./botPaymentManager.ts";

export async function botCourseManager(ctx: MyContext) {
  await ctx.editMessageText("Управление курсами:");
  await ctx.editMessageReplyMarkup({ reply_markup: courseKeyboard });
}

export async function botAddCourseStart(ctx: MyContext) {
  ctx.session.stage = "addCourse";

  await ctx.answerCallbackQuery();
  await ctx.reply(
    "Введи название курса, а через запятую ссылку на присоединение к нему",
  );
}

export async function botAddCourseExecute(ctx: MyContext) {
  if (!ctx.message) return;
  const messageText = ctx.message.text;
  if (!messageText) return;
  const [courseName, courseLink] = messageText.split(",").map((item) =>
    item.trim()
  );

  if (!courseName || !courseLink) {
    await ctx.reply(
      "Ошибка! Убедитесь, что вы ввели название курса и ссылку, разделённые запятой",
    );
    return;
  }

  await addCourse(courseName, courseLink);
  await ctx.reply("Курс добавлен!", {
    reply_markup: courseKeyboard,
  });
  console.log("Added course", courseName, courseLink);
}

export async function botCourseList(ctx: MyContext) {
  const { keyboard, isEmpty } = await createCoursesSelectionKeyboard(true);
  if (isEmpty) {
    await ctx.reply("Курсов нет");
  } else {
    await ctx.editMessageText(
      "Список активных курсов. Нажми на курс чтобы удалить его.",
    );
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
  }
}

export async function botChoseCourse(ctx: MyContext) {
  const userId = ctx.from?.id;
  const courseName = ctx.match?.[1];

  if (userId === Number(VIID) || userId === Number(SVETLOVID)) {
    if (courseName) {
      await removeCourse(courseName);
      await ctx.reply("Курс удалён!", {
        reply_markup: courseKeyboard,
      });
      console.log("Removed course", courseName);
    }
    return;
  }

  if (userId && courseName) {
    const course = await getCourseByName(courseName);
    if (course) {
      await updateTemporaryUser(userId, "courses", [course]);
    }
  }
  const price = await getCoursePrice();

  ctx.session.stage = "paymentProcess";
  await ctx.reply(
    "Цена курса: " + price + "\n" +
    "Пожалуйста, отправьте фото с квитанцией оплаты \n" +
      "Варианты оплаты: \n" +
      `Номер карты Тинькофф:
       5536 9138 2905 0125
       Держатель: Виктория Алексеевна Маяковская \n` +
      "Для зарубежных карт: \n" +
      "https://revolut.me/ivan1fhj3",
  );
}

export async function botCompleteCourse(ctx: MyContext) {
  const courseName = ctx.match?.[1];
  if (!courseName) {
    await ctx.reply("Ошибка! Напиши о ней Мише");
    console.log("Error: No course name provided");
    return;
  }
  await completeCourse(courseName);
  await ctx.reply(
    `Курс "${courseName}" завершен. \n` +
    "Все студенты исключены из курса и переведены в историю.",
    { reply_markup: adminKeyboard }
  );
}