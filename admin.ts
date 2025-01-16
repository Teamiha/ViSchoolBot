import { getKv } from "./botStatic/kvClient.ts";
import { UserData } from "./DB/mainDB.ts";
import { HomeworkSubmission } from "./DB/homeworkManagerDB.ts";

export async function listAllViBotRecords() {
  const kv = await getKv();

  console.log("\n=== ViBot Records ===\n");

  // List all entries with prefix "ViBot"
  const entries = kv.list({ prefix: ["ViBot"] });

  for await (const entry of entries) {
    console.log("Key:", entry.key);
    console.log("Value:", entry.value);
    console.log("-------------------");
  }
}

export async function deleteAllViBotRecords() {
  const kv = await getKv();

  console.log("\n=== Deleting All ViBot Records ===\n");

  // List all entries with prefix "ViBot"
  const entries = kv.list({ prefix: ["ViBot"] });

  let deletedCount = 0;
  for await (const entry of entries) {
    await kv.delete(entry.key);
    console.log("Deleted:", entry.key);
    deletedCount++;
  }

  console.log(`\nTotal records deleted: ${deletedCount}`);
}

async function createMockUsers() {
  const kv = await getKv();
  for (let i = 1; i <= 10; i++) {
    await kv.set(["ViBot", "userId:", i], {
      paymentInProcess: true,
      nickName: `user${i}`,
      name: `User ${i}`,
      birthday: "01.01.2000",
      school: "School 1",
      class: "10",
      courses: "Math, Science",
      hwoRegistered: "2024-01-01",
      notes: "Mock user",
    });
  }
}

async function addMockUsersToPaymentConfirmationRequests() {
  const kv = await getKv();
  const existingRequests =
    (await kv.get<number[]>(["ViBot", "paymentConfirmationRequests"])).value ||
    [];

  // Add mock users (1-10) to the requests list
  const updatedRequests = [...existingRequests];
  for (let i = 1; i <= 10; i++) {
    if (!updatedRequests.includes(i)) {
      updatedRequests.push(i);
    }
  }

  await kv.set(["ViBot", "paymentConfirmationRequests"], updatedRequests);
  console.log("Added mock users to payment confirmation requests");
}

async function createMockHomeworks() {
  const kv = await getKv();
  const courses = ["Математика", "Физика", "Информатика", "Английский"];

  for (let i = 1; i <= 10; i++) {
    const submission: HomeworkSubmission = {
      studentId: i, // Соответствует ID из createMockUsers
      messageId: Math.floor(Math.random() * 1000000), // Случайный message_id
      chatId: Math.floor(Math.random() * 1000000), // Случайный chat_id
      courseName: courses[Math.floor(Math.random() * courses.length)],
      submittedAt: Date.now(),
      isChecked: false,
      history: [],
    };

    await kv.set(
      ["ViBot", "homework", `${submission.studentId}:${submission.courseName}`],
      submission,
    );

    console.log(
      `Created homework for student ${i} in ${submission.courseName}`,
    );
  }

  console.log("\nCreated 10 mock homework submissions");
}

// Раскомментируйте нужную функцию для выполнения
// createMockUsers();
// createMockHomeworks();
listAllViBotRecords();
// deleteAllViBotRecords();
// addMockUsersToPaymentConfirmationRequests();


// TODO:


// - Добавить функционал комментариев при принятии

// - Исправить текст после оплаты при повторной записи

// - менеджер учеников. 