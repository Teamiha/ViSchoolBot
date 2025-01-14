import { createHomeworkCheckKeyboard } from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";


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