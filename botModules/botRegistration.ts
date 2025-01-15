import {
  confirmRegistration,
  createTemporaryUser,
  updateTemporaryUser,
} from "../DB/temporaryUserDB.ts";
import { MyContext } from "../bot.ts";
import { getUser, updateUser } from "../DB/mainDB.ts";
import { ADMIN_ID } from "../config.ts";
import { addPaymentConfirmationRequest } from "../DB/paymentManagerDB.ts";

export async function botRegistration(ctx: MyContext) {
  if (ctx.from?.id) {
    await createTemporaryUser(ctx.from?.id);
  }
  console.log("Temporary user created for user", ctx.from?.id);

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

export async function botRegistrationExecute(ctx: MyContext) {
  if (!ctx.from?.id) return;
  if (!ctx.message?.photo) return;
  if (!ctx.chat?.id) return;

  const userId = ctx.from?.id;

  ctx.session.stage = "null";
  await confirmRegistration(ctx.from?.id);

  console.log("Registration confirmed for user", userId);

  await addPaymentConfirmationRequest(ctx.from?.id);
  await updateUser(ctx.from?.id, "paymentInProcess", true);

  // Получаем данные пользователя
  const userData = await getUser(userId);
  const userNickname = userData.value?.nickName || "Нет username";
  const userName = userData.value?.name || "Нет имени";

  // Пересылаем фото администратору
  await ctx.api.forwardMessage(
    ADMIN_ID,
    ctx.chat.id,
    ctx.message.message_id,
  );

  // Отправляем сообщение администратору
  await ctx.api.sendMessage(
    ADMIN_ID,
    `Ура! От пользователя (ID: ${userId}, @${userNickname}, ${userName}) пришла оплата.\n` +
      `Как проверишь, подтверди её факт в администраторском разделе "Подтвердить оплату".`,
  );

  await ctx.reply(
    "Спасибо! После подтверждения оплаты, вам прийдет сообщение о завершении регистрации.",
  );

  console.log("Payment in process for user", userId);
}
