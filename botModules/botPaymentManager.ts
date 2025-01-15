import {
  adminKeyboard,
  createPaymentConfirmationKeyboard,
} from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";
import { InlineKeyboard } from "@grammyjs/bot";
import { addActiveStudent, updateUser } from "../DB/mainDB.ts";
import { removePaymentConfirmationRequest } from "../DB/paymentManagerDB.ts";

export async function botCheckPayments(ctx: MyContext) {
  const { keyboard, isEmpty } = await createPaymentConfirmationKeyboard();

  if (isEmpty) {
    await ctx.reply(
      "На данный момент нет пользователей, ожидающих подтверждения оплаты.",
    );
    return;
  }

  await ctx.reply("Список пользователей, ожидающих подтверждения оплаты:", {
    reply_markup: keyboard,
  });
}

export async function botConfirmPayment(ctx: MyContext) {
  if (ctx.match) {
    const userId = Number(ctx.match[1]);

    await ctx.reply(
      `Ты уверена, что хочешь подтвердить оплату для пользователя ${userId}?`,
      {
        reply_markup: new InlineKeyboard()
          .text("Да", `final_confirm_payment:${userId}`)
          .text("Нет", "cancel_confirmation"),
      },
    );
  }
}

export async function botFinalConfirmPayment(ctx: MyContext) {
  if (ctx.match) {
    const userId = Number(ctx.match[1]);

    // Обновляем статус оплаты
    await updateUser(userId, "paymentInProcess", false);
    await removePaymentConfirmationRequest(userId);
    await addActiveStudent(userId);

    console.log("Payment confirmed for user", userId);

    await ctx.reply("Оплата подтверждена!", { reply_markup: adminKeyboard });

    await ctx.api.sendMessage(
      userId,
      "Ваша оплата была подтверждена! Нажмите /start чтобы попасть в меню учащегося",
    );
  }
}
