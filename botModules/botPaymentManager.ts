import {
  adminKeyboard,
  createPaymentConfirmationKeyboard,
} from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";
import { InlineKeyboard } from "@grammyjs/bot";
import { addActiveStudent, updateUser, deleteUser, getUser } from "../DB/mainDB.ts";
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
          .text("Нет", `cancel_confirmation:${userId}`),
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

    const userData = await getUser(userId);
    const userCourses = userData.value?.courses || [];

    console.log("Payment confirmed for user", userId);

    await ctx.reply("Оплата подтверждена!", { reply_markup: adminKeyboard });

    // Формируем сообщение с ссылкой на курс
    let message = "Ваша оплата была подтверждена!\n";
    
    if (userCourses.length > 0) {
      message += "\nСсылка для присоединения к курсу:\n";
      userCourses.forEach(course => {
        message += `${course.name}: ${course.link}\n`;
      });
    }
    
    message += "\nНажмите /start чтобы попасть в меню учащегося";

    await ctx.api.sendMessage(userId, message);
  }
}

export async function botCancelConfirmation(ctx: MyContext) {
  if (ctx.match) {
    const userId = Number(ctx.match[1]);
    await removePaymentConfirmationRequest(userId);
    await deleteUser(userId);
    await ctx.reply(
      "Оплата отклонена, пользователь удалён",
      { reply_markup: adminKeyboard },
    );
  }
}
