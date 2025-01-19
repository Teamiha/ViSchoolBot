import { MyContext } from "../bot.ts";
import {
  adminKeyboard,
  manageStudentsKeyboard,
  createActiveStudentsKeyboard,
} from "../botStatic/keyboard.ts";
import { moveCoursesToHistory } from "../DB/courseManagerDB.ts";
import { removeActiveStudent, getUser } from "../DB/mainDB.ts";

export async function botManageStudents(ctx: MyContext) {
  await ctx.reply("Выбери опцию:", {
    reply_markup: manageStudentsKeyboard,
  });
}

export async function botDeleteStudentFromActive(ctx: MyContext) {
  const { keyboard, isEmpty } = await createActiveStudentsKeyboard();
  if (isEmpty) {
    await ctx.reply("Нет активных студентов", {
      reply_markup: adminKeyboard,
    });
    return;
  }
  await ctx.reply("Выбери ученика для отчисления:", {
    reply_markup: keyboard,
  });
}

export async function botDeleteStudentFromActiveExecute(ctx: MyContext) {
  if (ctx.match) {
      const userId = Number(ctx.match[1]);
      const userData = await getUser(userId);

      if (!userData.value) {
        await ctx.reply("Ошибка: данные ученика не найдены");
        console.log("User data not found for user", userId);
        return;
      }

      const userNickName = userData.value.nickName || "Нет username";
      const userName = userData.value.name || "Нет имени";

      await removeActiveStudent(userId);
      await moveCoursesToHistory(userId);
      await ctx.reply(
        `Студент ${userNickName} (${userName}) исключён с курса.`,
        { reply_markup: adminKeyboard },
      );
      console.log(
        `Student ${userNickName} (${userName}) excluded from course.`,
      );
    }
  }
