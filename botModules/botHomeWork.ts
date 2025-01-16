import { createHomeworkCheckKeyboard } from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";
import {
  changeHomeworkCheckStatus,
  deleteHomework,
  getHomeworkSubmission,
  getStudentHomework,
} from "../DB/homeworkManagerDB.ts";
import { getUser } from "../DB/mainDB.ts";
import { backButton, homeworkResponseKeyboard } from "../botStatic/keyboard.ts";
import { SVETLOVID } from "../config.ts";
import { submitHomework } from "../DB/homeworkManagerDB.ts";

export async function botCheckHomework(ctx: MyContext) {
  const { keyboard, isEmpty } = await createHomeworkCheckKeyboard();
  if (isEmpty) {
    await ctx.reply("Нет непроверенных домашних заданий", {
      reply_markup: backButton,
    });
  } else {
    await ctx.reply("Выберите домашнее задание для проверки", {
      reply_markup: keyboard,
    });
  }
}

export async function botStudentSendHomework(ctx: MyContext) {
  ctx.session.stage = "sendHomework";
  await ctx.reply(
    "Пожалуйста, следующим сообщением отправьте фото домашнего задания \n" +
      "Так же, в сообщение с фото, вы можете добавить комментарий к заданию.",
  );
}

export async function botStudentSendHomeworkExecute(ctx: MyContext) {
  if (!ctx.from?.id) {
    console.log("Error studentSendHomeworkExecute: No user ID provided");
    return;
  }
  if (!ctx.message?.photo) {
    console.log("Error studentSendHomeworkExecute: No photo provided");
    return;
  }
  if (!ctx.chat?.id) {
    console.log("Error studentSendHomeworkExecute: No chat ID provided");
    return;
  }

  const studentId = ctx.from.id;
  const messageId = ctx.message.message_id;
  const chatId = ctx.chat.id;

  // Получаем данные пользователя
  const userData = await getUser(studentId);
  const userNickname = userData.value?.nickName || "Нет username";
  const userName = userData.value?.name || "Нет имени";

  if (!userData.value?.courses) {
    await ctx.reply("Ошибка: у вас нет активного курса");
    ctx.session.stage = "null";
    return;
  }

  await submitHomework(
    studentId,
    messageId,
    chatId,
    userData.value.courses[0].name,
  );

  console.log("Homework submitted for user", studentId);

  await ctx.reply(
    "Спасибо! Как только учитель проверит вашу работу, вы получите уведомление.",
  );

  await ctx.api.sendMessage(
    SVETLOVID,
    `Учащийся (ID: ${studentId}, @${userNickname}, ${userName}) отправил домашнее задание.\n` +
      `Проверить его работу можно в разделе "Проверить домашние задания".`,
  );
}

export async function botSelectHomework(ctx: MyContext) {
  const [studentId, courseName] = ctx.match?.[1].split(":") || [];
  if (!studentId || !courseName) {
    console.log("Error selectHomework: No student ID or course name provided");
    return;
  }

  const homework = await getHomeworkSubmission(`${studentId}:${courseName}`);
  if (!homework) {
    await ctx.reply("Ошибка: домашняя работа не найдена");
    console.log("Homework not found for user", studentId);
    return;
  }

  const userData = await getUser(Number(studentId));
  if (!userData.value) {
    await ctx.reply("Ошибка: данные ученика не найдены");
    console.log("User data not found for user", studentId);
    return;
  }

  const teacherId = Number(SVETLOVID); // или можно использовать SVETLOVID
  await ctx.api.forwardMessage(
    teacherId,
    homework.chatId,
    homework.messageId,
  );

  if (homework.history && homework.history.length > 0) {
    await ctx.reply("История предыдущих версий:");

    for (const entry of homework.history) {
      await ctx.api.forwardMessage(
        teacherId,
        homework.chatId,
        entry.homeworkMessageId,
      );

      if (entry.teacherCommentMessageId) {
        await ctx.api.forwardMessage(
          teacherId,
          homework.chatId,
          entry.teacherCommentMessageId,
        );
      }
    }
  }

  const studentInfo = `Информация об ученике:
Имя: ${userData.value.name}
Курс: ${courseName}
Школа: ${userData.value.school}
Класс: ${userData.value.class}`;

  await ctx.reply(studentInfo, {
    reply_markup: homeworkResponseKeyboard(studentId, courseName),
  });
}

export async function botAcceptHomework(ctx: MyContext) {
  await ctx.answerCallbackQuery();

  const studentId = ctx.match?.[1];
  const courseName = ctx.match?.[2];

  if (!studentId || !courseName) {
    console.log("Error acceptHomework: No student ID or course name provided");
    return;
  }

  await deleteHomework(Number(studentId), courseName);
  console.log("Homework deleted for user", studentId);

  await ctx.api.sendMessage(
    Number(studentId),
    `✅ Ваша домашняя работа по курсу "${courseName}" принята!`,
  );

  await botCheckHomework(ctx);
}

export async function botReviseHomework(ctx: MyContext) {
  await ctx.answerCallbackQuery();

  const [studentId, courseName] = ctx.match?.[1].split(":") || [];
  if (!studentId || !courseName) {
    console.log("Error reviseHomework: No student ID or course name provided");
    return;
  }

  ctx.session.stage = "commentToHomework";
  ctx.session.homeworkData = { studentId, courseName };

  await ctx.reply("Напишите комментарий о том, что нужно доработать:");
}

export async function botReviseHomeworkExecute(ctx: MyContext) {
  if (!ctx.message?.text) {
    console.log("Error reviseHomeworkExecute: No message text provided");
    return;
  }
  if (!ctx.session.homeworkData) {
    console.log("Error reviseHomeworkExecute: No homework data provided");
    return;
  }

  const { studentId, courseName } = ctx.session.homeworkData;
  const comment = ctx.message.text;
  const messageId = ctx.message.message_id;

  const homework = await getStudentHomework(Number(studentId), courseName);
  if (homework) {
    homework.history.push({
      homeworkMessageId: homework.messageId,
      teacherCommentMessageId: messageId,
    });

    await changeHomeworkCheckStatus(`${studentId}:${courseName}`, true);

    await ctx.api.sendMessage(
      Number(studentId),
      `Ваша домашняя работа отправлена на доработку.\n\n` +
        `Комментарий учителя:\n${comment}\n\n` +
        `Пожалуйста, внесите исправления и отправьте работу снова.`,
    );
  }

  // Очищаем данные сессии
  ctx.session.stage = "null";
  ctx.session.homeworkData = undefined;

  // Показываем список оставшихся домашних работ
  await botCheckHomework(ctx);
}
