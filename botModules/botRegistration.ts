import { createTemporaryUser, updateTemporaryUser, getCourseByName } from "../db.ts";
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

export async function botChoseCourse(ctx: MyContext) {
    const userId = ctx.from?.id;
    const courseName = ctx.match?.[1];
    
    if (userId && courseName) {
        const course = await getCourseByName(courseName);
        if (course) {
            await updateTemporaryUser(userId, "courses", [course]);
        }
    }

    ctx.session.stage = "paymentProcess";
    await ctx.reply(
      "Пожалуйста, отправьте фото с квитанцией оплаты \n" +
      "Варианты оплаты: \n" +
      `Номер карты Тинькофф:
       5536 9138 2905 0125
       Держатель: Виктория Алексеевна Маяковская \n` +
      "Для зарубежных карт: \n" +
      "https://revolut.me/ivan1fhj3"
    );
}

