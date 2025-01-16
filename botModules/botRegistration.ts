import {
  confirmRegistration,
  createTemporaryUser,
  updateTemporaryUser,
} from "../DB/temporaryUserDB.ts";
import { MyContext } from "../bot.ts";
import { getUser, updateUser, UserData } from "../DB/mainDB.ts";
import { ADMIN_ID } from "../config.ts";
import { addPaymentConfirmationRequest } from "../DB/paymentManagerDB.ts";
import { updateDataKeyboard } from "../botStatic/keyboard.ts";
import { botStart } from "./botStart.ts";
import { InlineKeyboard } from "@grammyjs/bot";
import { moveCoursesToHistory } from "../DB/courseManagerDB.ts";
import { removeActiveStudent } from "../DB/mainDB.ts";

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
  if (!ctx.from?.id) {
    console.log("Error botRegistrationExecute: No user ID provided");
    return;
  }
  if (!ctx.message?.photo) {
    console.log("Error botRegistrationExecute: No photo provided");
    return;
  }
  if (!ctx.chat?.id) {
    console.log("Error botRegistrationExecute: No chat ID provided");
    return;
  }

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
    "Спасибо! После подтверждения оплаты, вам прийдет сообщение о завершении регистрации. \n" +
      "Не волнуйтесь о времени, вы уложились в 30 минут, время ожидания подтверждения оплаты не учитывается.",
  );

  console.log("Payment in process for user", userId);
}

export async function botUpdateStudentData(ctx: MyContext) {
  await ctx.reply("Выберите, какие данные вы хотите обновить:", {
    reply_markup: updateDataKeyboard,
  });
}

const validFields = ["school", "class", "hwoRegistered"] as const;
type ValidField = typeof validFields[number];

export async function botHandleUpdateField(ctx: MyContext) {
  const field = ctx.match?.[1] as ValidField;
  if (!validFields.includes(field)) return;

  ctx.session.updateField = field;
  ctx.session.stage = "updateStudentData";
  await ctx.reply("Напишите новое значение:");
}

export async function botUpdateDataExecute(ctx: MyContext) {
  if (!ctx.message?.text || !ctx.from?.id || !ctx.session.updateField) {
    return;
  }

  const userId = ctx.from.id;
  const newValue = ctx.message.text;
  const field = ctx.session.updateField;

  await updateUser(userId, field as keyof UserData, newValue);
  await ctx.reply("Данные успешно обновлены!");

  console.log("User data updated for user", userId, field, newValue);

  await botStart(ctx);

  ctx.session.updateField = undefined;
}

export async function botSelfUnsubscribe(ctx: MyContext) {
    if (ctx.match) {
      const userId = Number(ctx.match[1]);
  
      await ctx.reply(
        `Вы уверены, что хотите завершить обучение и уйти с курса?`,
        {
          reply_markup: new InlineKeyboard()
            .text("Да", `self_unsubscribe:${userId}`)
            .text("Нет", `backToStudent`),
        },
      );
    }
  }
    
export async function botSelfUnsubscribeExecute(ctx: MyContext) {
    if (ctx.match) {
        const userId = Number(ctx.match[1]);

        const userData = await getUser(Number(userId));
        if (!userData.value) {
            await ctx.reply("Ошибка: данные ученика не найдены");
            console.log("User data not found for user", userId);
            return;
        }

        await moveCoursesToHistory(userId);

        await removeActiveStudent(userId);

        await ctx.reply("Вы завершили обучение и ушли с курса.");

        await ctx.api.sendMessage(
            ADMIN_ID,
            `Учащийся (ID: ${userId}, @${userData.value.nickName}, ${userData.value.name}) завершил обучение и ушел с курса.`,
        );
    }
}