import {
  adminKeyboard,
  createPaymentConfirmationKeyboard,
} from "../botStatic/keyboard.ts";
import { MyContext } from "../bot.ts";
import { InlineKeyboard } from "@grammyjs/bot";
import {
  addActiveStudent,
  deleteUser,
  getUser,
  updateUser,
} from "../DB/mainDB.ts";
import { removePaymentConfirmationRequest } from "../DB/paymentManagerDB.ts";
import { getKv } from "../botStatic/kvClient.ts";

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
          .text("Нет (удалить пользователя)", `cancel_confirmation:${userId}`)
          .text("Возникли сложности", `payment_problems:${userId}`),
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
      userCourses.forEach((course) => {
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

export async function botPaymentProblems(ctx: MyContext) {
  if (ctx.match) {
    const userId = Number(ctx.match[1]);

    const message =
      "Возникли сложности с оплатой, пожалуйста, напишите <a href='https://t.me/Bodhisattva_vi'>Виктории</a> напрямую.";

    await ctx.api.sendMessage(userId, message, { parse_mode: "HTML" });

    await ctx.reply("Пользователь уведомлен о проблеме с оплатой", {
      reply_markup: adminKeyboard,
    });
  }
}

export async function setCoursePrice(ctx: MyContext) {
  await ctx.reply(
    "Напиши новую цену курса. \n" +
      `Можешь писать как тебе удобно, например: "10 000 рублей"`,
  );
  ctx.session.stage = "setCoursePrice";
}

export async function setCoursePriceExecute(ctx: MyContext, price: string) {
  const kv = await getKv();
  await kv.set(["ViBot", "coursePrice"], price);
  await ctx.reply("Цена курса установлена, новая цена: " + price, {
    reply_markup: adminKeyboard,
  });

  console.log("Course price set to", price);
}

export async function getCoursePrice() {
  const kv = await getKv();
  const price = await kv.get(["ViBot", "coursePrice"]);
  if (!price || !price.value) {
    return price.value = "Цена курса не установлена";
  }
  return price.value;
}
