import { getKv } from "../botStatic/kvClient.ts";
import { HomeworkSubmission } from "./mainDB.ts";

export async function submitHomework(
  studentId: number,
  messageId: number,
  chatId: number,
  courseName: string,
) {
  const kv = await getKv();

  // Проверяем, существует ли уже домашка для этого студента по этому курсу
  const existingHomework = await getStudentHomework(studentId, courseName);

  if (existingHomework) {
    // Если домашка существует, обновляем messageId и сохраняем старую версию в историю
    existingHomework.history = existingHomework.history || [];
    if (existingHomework.messageId) {
      existingHomework.history.push({
        homeworkMessageId: existingHomework.messageId,
        teacherCommentMessageId: 0, // Будет заполнено при добавлении комментария
      });
    }
    existingHomework.messageId = messageId;
    existingHomework.isChecked = false;

    await kv.set(
      ["ViBot", "homework", `${studentId}:${courseName}`],
      existingHomework,
    );
  } else {
    // Если это новая домашка
    const submission: HomeworkSubmission = {
      studentId,
      messageId,
      chatId,
      courseName,
      submittedAt: Date.now(),
      isChecked: false,
      history: [],
    };

    await kv.set(
      ["ViBot", "homework", `${studentId}:${courseName}`],
      submission,
    );
  }
}

export async function getHomeworks(): Promise<string[]> {
  const kv = await getKv();
  const result = await kv.get<string[]>(["ViBot", "homework"]);
  return result.value || [];
}

export async function getUncheckedHomeworks(): Promise<HomeworkSubmission[]> {
  const kv = await getKv();
  const homeworks = kv.list<HomeworkSubmission>({
    prefix: ["ViBot", "homework"],
  });
  const uncheckedHomeworks: HomeworkSubmission[] = [];

  for await (const entry of homeworks) {
    if (entry.value && !entry.value.isChecked) {
      uncheckedHomeworks.push(entry.value);
    }
  }

  return uncheckedHomeworks;
}

export async function getHomeworkSubmission(
  homeworkKey: string,
): Promise<HomeworkSubmission | null> {
  const kv = await getKv();
  const result = await kv.get<HomeworkSubmission>([
    "ViBot",
    "homework",
    homeworkKey,
  ]);
  return result.value || null;
}

export async function markHomeworkAsChecked(homeworkKey: string) {
  const kv = await getKv();

  // Обновляем статус домашнего задания
  const homework = await getHomeworkSubmission(homeworkKey);
  if (homework) {
    homework.isChecked = true;
    await kv.set(["ViBot", "homework", homeworkKey], homework);
  }
}

// Добавляем функцию для сохранения комментария учителя
export async function addTeacherCommentToHistory(
  studentId: number,
  courseName: string,
  teacherCommentMessageId: number,
) {
  const kv = await getKv();
  const homework = await getStudentHomework(studentId, courseName);

  if (homework && homework.history.length > 0) {
    // Добавляем ID комментария к последней записи в истории
    const lastHistoryEntry = homework.history[homework.history.length - 1];
    lastHistoryEntry.teacherCommentMessageId = teacherCommentMessageId;

    await kv.set(["ViBot", "homework", `${studentId}:${courseName}`], homework);
  }
}

// Вспомогательная функция для получения домашки конкретного студента
export async function getStudentHomework(
  studentId: number,
  courseName: string,
): Promise<HomeworkSubmission | null> {
  const kv = await getKv();
  const result = await kv.get<HomeworkSubmission>(
    ["ViBot", "homework", `${studentId}:${courseName}`],
  );
  return result.value || null;
}

// Функция для удаления принятой домашки
export async function deleteHomework(studentId: number, courseName: string) {
  const kv = await getKv();
  await kv.delete(["ViBot", "homework", `${studentId}:${courseName}`]);
}
