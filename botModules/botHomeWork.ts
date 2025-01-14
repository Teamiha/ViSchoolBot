import { createHomeworkCheckKeyboard } from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";
import { getHomeworkSubmission } from "../DB/homeworkManagerDB.ts";
import { getUser } from "../DB/mainDB.ts";
import { homeworkResponseKeyboard } from "../botStatic/keyboard.ts";
import { SVETLOVID } from "../config.ts";

export async function botCheckHomework(ctx: MyContext) {
  const { keyboard, isEmpty } = await createHomeworkCheckKeyboard();
  if (isEmpty) {
    await ctx.reply("Нет непроверенных домашних заданий");
  } else {
    await ctx.reply("Выберите домашнее задание для проверки", { reply_markup: keyboard });
  }
}

export async function botStudentSendHomework(ctx: MyContext) {
    ctx.session.stage = "sendHomework";
    await ctx.reply("Пожалуйста, следующим сообщением отправьте фото домашнего задания \n" +
        "Так же, в сообщение с фото, вы можете добавить комментарий к заданию."
    );

}

export async function botSelectHomework(ctx: MyContext) {
    
    // Получаем studentId и courseName из callback data
    const [studentId, courseName] = ctx.match?.[1].split(':') || [];
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
        homework.messageId
    );

    // Отправляем информацию об ученике и клавиатуру для ответа
    const studentInfo = `Информация об ученике:
Имя: ${userData.value.name}
Курс: ${courseName}
Школа: ${userData.value.school}
Класс: ${userData.value.class}`;

    await ctx.reply(studentInfo, {
        reply_markup: homeworkResponseKeyboard(studentId, courseName)
    });
}