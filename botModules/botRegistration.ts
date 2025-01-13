import { createTemporaryUser, updateTemporaryUser } from "../db.ts";
import { MyContext } from "../bot.ts";

export async function botRegistration(ctx: MyContext) {
  if (ctx.from?.id) {
    await createTemporaryUser(ctx.from?.id);
  }

  if (ctx.from?.username) {
    await updateTemporaryUser(ctx.from?.id, "nickName", ctx.from?.username);
  }

  ctx.session.stage = "askName";
  await ctx.reply(
    "Начат процесс регистрации.\n" +
      "Пожалуйста, введите все данные и проведите оплату за обучение в течении 30 минут.\n" +
      "Если не успеете, то придется пройти регистрацию заново.\n\n" +
      "Напишите имя учащегося:",
  );
}
