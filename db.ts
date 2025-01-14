import { getKv } from "./botStatic/kvClient.ts";
import { REGISTRATION_TIMEOUT } from "./botStatic/const.ts";

export interface UserData {
  paymentInProcess: boolean;
  nickName: string;
  name: string;
  birthday: string;
  school: string;
  class: string;
  courses: Course[];
  hwoRegistered: string;
  notes: string;
}

interface Course {
  name: string;
  link: string;
}

// Homework interfaces
interface HomeworkSubmission {
  studentId: number;
  messageId: number;
  chatId: number;
  courseName: string;
  submittedAt: number;
  isChecked: boolean;
  history: {
    homeworkMessageId: number;
    teacherCommentMessageId: number;
  }[];
}

export async function createNewUser(userId: number) {
  const kv = await getKv();

  const newUserData: UserData = {
    paymentInProcess: false,
    nickName: "",
    name: "",
    birthday: "",
    school: "",
    class: "",
    courses: [],
    hwoRegistered: "",
    notes: "",
  };

  await kv.set(["ViBot", "userId:", userId], newUserData);
}

export async function getUser(userId: number) {
  const kv = await getKv();
  const user = await kv.get<UserData>(["ViBot", "userId:", userId]);
  //   if (!user.value) {
  //     await createNewUser(userId);
  //     const newUserData = await kv.get(["ViBot", "userId:", userId]);
  //     console.log("new user");
  //     return newUserData;
  //   }
  return user;
}

export async function getUserIdByName(
  userName: string,
): Promise<number | null> {
  const kv = await getKv();
  const users = kv.list<UserData>({ prefix: ["ViBot", "userId:"] });

  for await (const entry of users) {
    if (entry.value && entry.value.name === userName) {
      const key = entry.key[2] as string;
      const userId = Number(key.replace("userId:", ""));
      return userId;
    }
  }

  return null;
}

export async function updateUser<Key extends keyof UserData>(
  userId: number,
  dataUpdate: Key,
  valueUpdate: UserData[Key],
) {
  const kv = await getKv();
  const currentData = await kv.get<UserData>(["ViBot", "userId:", userId]);
  if (
    currentData && currentData.value && `${dataUpdate}` in currentData.value
  ) {
    currentData.value[dataUpdate] = valueUpdate;
    await kv.set(["ViBot", "userId:", userId], currentData.value);
  } else {
    console.log("Запись не найдена");
  }
}

// export async function getAllUserNamesAwaitPayConfirmation(): Promise<string[]> {
//   const kv = await getKv();
//   const users = kv.list<UserData>({ prefix: ["ViBot", "userId:"] });
//   const names: string[] = [];

//   for await (const user of users) {
//     if (user.value && user.value.name) {
//       names.push(user.value.name);
//     }
//   }

//   return names;
// }

export async function getUserParametr<Key extends keyof UserData>(
  userId: number,
  parametr: Key,
) {
  const user = await getUser(userId);
  return (user.value as UserData)[parametr];
}

export async function getUserPaymentInProcess(userId: number) {
  try {
    const user = await getUser(userId);
    return (user.value as UserData).paymentInProcess;
  } catch (_error) {
    return false;
  }
}

// Student status management

export async function addActiveStudent(userId: number) {
  const kv = await getKv();

  const result = await kv.get<number[]>(["ViBot", "activeStudentList"]);
  const activeStudentList = result.value || [];

  if (!activeStudentList.includes(userId)) {
    activeStudentList.push(userId);
    await kv.set(["ViBot", "activeStudentList"], activeStudentList);
  }
}

export async function removeActiveStudent(userId: number) {
  const kv = await getKv();

  const result = await kv.get<number[]>(["ViBot", "activeStudentList"]);
  const activeStudentList = result.value || [];

  const updatedList = activeStudentList.filter((id) => id !== userId);

  await kv.set(["ViBot", "activeStudentList"], updatedList);
  //   await kv.delete(["ViBot", "userId:", userId]);
}

export async function isActiveStudent(userId: number): Promise<boolean> {
  const kv = await getKv();

  const result = await kv.get<number[]>(["ViBot", "activeStudentList"]);
  const activeStudentList = result.value || [];

  return activeStudentList.includes(userId);
}

// Blocked user

export async function blockUser(userId: number) {
  const kv = await getKv();
  const result = await kv.get<number[]>(["ViBot", "blocked"]);
  const blockedList = result.value || [];

  if (!blockedList.includes(userId)) {
    blockedList.push(userId);
    await kv.set(["ViBot", "blocked"], blockedList);
  }
}

export async function unblockUser(userId: number) {
  const kv = await getKv();
  const result = await kv.get<number[]>(["ViBot", "blocked"]);
  const blockedList = result.value || [];

  const updatedList = blockedList.filter((id) => id !== userId);
  await kv.set(["ViBot", "blocked"], updatedList);
}

export async function isUserBlocked(userId: number): Promise<boolean> {
  const kv = await getKv();
  const result = await kv.get<number[]>(["ViBot", "blocked"]);
  const blockedList = result.value || [];

  return blockedList.includes(userId);
}

// Temporary user

export async function createTemporaryUser(userId: number) {
  const kv = await getKv();

  const newUserData: UserData = {
    paymentInProcess: false,
    nickName: "",
    name: "",
    birthday: "",
    school: "",
    class: "",
    courses: [],
    hwoRegistered: "",
    notes: "",
  };

  await kv.set(["ViBot", "tempUsers:", userId], newUserData, {
    expireIn: REGISTRATION_TIMEOUT,
  });
}

export async function updateTemporaryUser<Key extends keyof UserData>(
  userId: number,
  dataUpdate: Key,
  valueUpdate: UserData[Key],
) {
  const kv = await getKv();
  const currentData = await kv.get<UserData>(["ViBot", "tempUsers:", userId]);

  if (currentData && currentData.value) {
    currentData.value[dataUpdate] = valueUpdate;
    await kv.set(["ViBot", "tempUsers:", userId], currentData.value, {
      expireIn: REGISTRATION_TIMEOUT,
    });
  }
}

export async function confirmRegistration(userId: number) {
  const kv = await getKv();

  const tempUser = await kv.get<UserData>(["ViBot", "tempUsers:", userId]);

  if (tempUser.value) {
    await kv.set(["ViBot", "userId:", userId], tempUser.value);
    await kv.delete(["ViBot", "tempUsers:", userId]);
  }
}

export async function deleteTemporaryUser(userId: number) {
  const kv = await getKv();
  await kv.delete(["ViBot", "tempUsers:", userId]);
}

export async function hasTemporaryRegistration(
  userId: number,
): Promise<boolean> {
  const kv = await getKv();
  const tempUser = await kv.get<UserData>(["ViBot", "tempUsers:", userId]);
  return !!tempUser.value;
}

// Payment confirmation request management
export async function addPaymentConfirmationRequest(userId: number) {
  const kv = await getKv();

  const result = await kv.get<number[]>([
    "ViBot",
    "paymentConfirmationRequests",
  ]);
  const requestsList = result.value || [];

  if (!requestsList.includes(userId)) {
    requestsList.push(userId);
    await kv.set(["ViBot", "paymentConfirmationRequests"], requestsList);
  }
}

export async function removePaymentConfirmationRequest(userId: number) {
  const kv = await getKv();

  const result = await kv.get<number[]>([
    "ViBot",
    "paymentConfirmationRequests",
  ]);
  const requestsList = result.value || [];

  const updatedList = requestsList.filter((id) => id !== userId);

  await kv.set(["ViBot", "paymentConfirmationRequests"], updatedList);
}

export async function hasPaymentConfirmationRequest(
  userId: number,
): Promise<boolean> {
  const kv = await getKv();

  const result = await kv.get<number[]>([
    "ViBot",
    "paymentConfirmationRequests",
  ]);
  const requestsList = result.value || [];

  return requestsList.includes(userId);
}

export async function getPaymentConfirmationRequestNames(): Promise<string[]> {
  const kv = await getKv();
  const result = await kv.get<number[]>([
    "ViBot",
    "paymentConfirmationRequests",
  ]);
  const requestsList = result.value || [];

  const names: string[] = [];

  for await (const userId of requestsList) {
    const userData = await kv.get<UserData>(["ViBot", "userId:", userId]);
    if (userData.value?.name) {
      names.push(userData.value.name);
    }
  }

  return names;
}

// Course management

export async function addCourse(courseName: string, courseLink: string) {
  const kv = await getKv();
  const currentCourses = await getCourses();
  
  const newCourse: Course = {
    name: courseName,
    link: courseLink
  };
  
  currentCourses.push(newCourse);
  await kv.set(["ViBot", "courses"], currentCourses);
}

export async function removeCourse(courseName: string) {
  const kv = await getKv();
  const currentCourses = await getCourses();
  
  const updatedCourses = currentCourses.filter(course => course.name !== courseName);
  await kv.set(["ViBot", "courses"], updatedCourses);
}

export async function getCourses(): Promise<Course[]> {
  const kv = await getKv();
  const result = await kv.get<Course[]>(["ViBot", "courses"]);
  return result.value || [];
}

export async function getCourseNames(): Promise<string[]> {
  const courses = await getCourses();
  return courses.map(course => course.name);
}

export async function getCourseByName(courseName: string): Promise<Course | undefined> {
  const courses = await getCourses();
  return courses.find(course => course.name === courseName);
}

// Homework management

export async function submitHomework(
  studentId: number,
  messageId: number,
  chatId: number,
  courseName: string
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
        teacherCommentMessageId: 0 // Будет заполнено при добавлении комментария
      });
    }
    existingHomework.messageId = messageId;
    existingHomework.isChecked = false;
    
    await kv.set(["ViBot", "homework", `${studentId}:${courseName}`], existingHomework);
  } else {
    // Если это новая домашка
    const submission: HomeworkSubmission = {
      studentId,
      messageId,
      chatId,
      courseName,
      submittedAt: Date.now(),
      isChecked: false,
      history: []
    };
    
    await kv.set(["ViBot", "homework", `${studentId}:${courseName}`], submission);
  }
}

export async function getHomeworks(): Promise<string[]> {
  const kv = await getKv();
  const result = await kv.get<string[]>(["ViBot", "homework"]);
  return result.value || [];
}

export async function getUncheckedHomeworks(): Promise<HomeworkSubmission[]> {
    const kv = await getKv();
    const homeworks = kv.list<HomeworkSubmission>({ prefix: ["ViBot", "homework"] });
    const uncheckedHomeworks: HomeworkSubmission[] = [];
  
    for await (const entry of homeworks) {
      if (entry.value && !entry.value.isChecked) {
        uncheckedHomeworks.push(entry.value);
      }
    }
  
    return uncheckedHomeworks;
  }

export async function getHomeworkSubmission(homeworkKey: string): Promise<HomeworkSubmission | null> {
  const kv = await getKv();
  const result = await kv.get<HomeworkSubmission>(["ViBot", "homework", homeworkKey]);
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
  teacherCommentMessageId: number
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
  courseName: string
): Promise<HomeworkSubmission | null> {
  const kv = await getKv();
  const result = await kv.get<HomeworkSubmission>(
    ["ViBot", "homework", `${studentId}:${courseName}`]
  );
  return result.value || null;
}

// Функция для удаления принятой домашки
export async function deleteHomework(studentId: number, courseName: string) {
  const kv = await getKv();
  await kv.delete(["ViBot", "homework", `${studentId}:${courseName}`]);
}