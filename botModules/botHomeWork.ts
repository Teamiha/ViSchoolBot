import { createHomeworkCheckKeyboard } from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";
import {
  changeHomeworkCheckStatus,
  deleteHomework,
  getHomeworkSubmission,
  getStudentHomework,
} from "../DB/homeworkManagerDB.ts";
import { getUser } from "../DB/mainDB.ts";
import { homeworkResponseKeyboard } from "../botStatic/keyboard.ts";
import { SVETLOVID } from "../config.ts";

export async function botCheckHomework(ctx: MyContext) {
  const { keyboard, isEmpty } = await createHomeworkCheckKeyboard();
  if (isEmpty) {
    await ctx.reply("Нет непроверенных домашних заданий");
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

export async function botSelectHomework(ctx: MyContext) {
  // Получаем studentId и courseName из callback data
  const [studentId, courseName] = ctx.match?.[1].split(":") || [];
  if (!studentId || !courseName) return;

  // Получаем данные о домашней работе
  const homework = await getHomeworkSubmission(`${studentId}:${courseName}`);
  if (!homework) {
    await ctx.reply("Ошибка: домашняя работа не найдена");
    return;
  }

  // Получаем данные об ученике
  const userData = await getUser(Number(studentId));
  if (!userData.value) {
    await ctx.reply("Ошибка: данные ученика не найдены");
    return;
  }

  // Пересылаем сообщение с домашней работой
  const teacherId = Number(SVETLOVID); // или можно использовать SVETLOVID
  await ctx.api.forwardMessage(
    teacherId,
    homework.chatId,
    homework.messageId,
  );

  if (homework.history && homework.history.length > 0) {
    await ctx.reply("История предыдущих версий:");

    // Отправляем каждую версию из истории
    for (const entry of homework.history) {
      // Отправляем фото домашней работы
      await ctx.api.forwardMessage(
        teacherId,
        homework.chatId,
        entry.homeworkMessageId,
      );

      // Если есть комментарий учителя, отправляем его
      if (entry.teacherCommentMessageId) {
        await ctx.api.forwardMessage(
          teacherId,
          homework.chatId,
          entry.teacherCommentMessageId,
        );
      }
    }
  }

  // Отправляем информацию об ученике и клавиатуру для ответа
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

  const [studentId, courseName] = ctx.match?.[1].split(":") || [];
  if (!studentId || !courseName) return;

  // Удаляем домашку из базы
  await deleteHomework(Number(studentId), courseName);

  // Отправляем уведомление ученику
  await ctx.api.sendMessage(
    Number(studentId),
    `✅ Ваша домашняя работа по курсу "${courseName}" принята!`,
  );

  // Показываем обновленный список домашних работ
  await botCheckHomework(ctx);
}

export async function botReviseHomework(ctx: MyContext) {
  await ctx.answerCallbackQuery();

  const [studentId, courseName] = ctx.match?.[1].split(":") || [];
  if (!studentId || !courseName) return;

  ctx.session.stage = "commentToHomework";
  ctx.session.homeworkData = { studentId, courseName };

  await ctx.reply("Напишите комментарий о том, что нужно доработать:");
}

export async function botReviseHomeworkExecute(ctx: MyContext) {
  if (!ctx.message?.text) return;
  if (!ctx.session.homeworkData) return;

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
