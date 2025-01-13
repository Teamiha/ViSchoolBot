import { MyContext } from "../bot.ts";
import { addCourse } from "../db.ts";
import { courseKeyboard } from "../botStatic/keyboard.ts";



export async function botAddCourseStart(ctx: MyContext) {
    ctx.session.stage = "addCourse"

    await ctx.answerCallbackQuery();
    await ctx.reply("Введи название курса, а через запятую ссылку на присоединение к нему");
}

export async function botAddCourseExecute(ctx: MyContext) {
    if (!ctx.message) return;
    const messageText = ctx.message.text;
    if (!messageText) return;
    const [courseName, courseLink] = messageText.split(',').map(item => item.trim());
    
    if (!courseName || !courseLink) {
        await ctx.reply("Ошибка! Убедитесь, что вы ввели название курса и ссылку, разделённые запятой");
        return;
    }
    
    await addCourse(courseName, courseLink);
}

export async function botCourseManager(ctx: MyContext) {
    await ctx.reply("Управление курсами:", {
        reply_markup: courseKeyboard
    });
}