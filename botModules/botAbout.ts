import { botStart } from "./botStart.ts";
import { MyContext } from "../bot.ts";

export async function botAbout(ctx: MyContext) {
  const aboutText = `Бот для помощи в обучении.
    Используемый при разработке стек:
    - Typescript
    - Deno
    - Grammy

    Владелец бота: @Bodhisattva_vi

    Автор: @teamiha
    Открыт для заказов на разработку и для постоянной работы.
    `;
  await ctx.editMessageText(aboutText);
  await botStart(ctx);
}
