import { getKv } from "../botStatic/kvClient.ts";

export interface UserData {
  paymentInProcess: boolean;
  nickName: string;
  name: string;
  birthday: string;
  school: string;
  class: string;
  courses: Course[];
  courseHistory: Course[];
  hwoRegistered: string;
  notes: string;
}

export interface Course {
  name: string;
  link: string;
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
    courseHistory: [],
    hwoRegistered: "",
    notes: "",
  };

  await kv.set(["ViBot", "userId:", userId], newUserData);
}

export async function getUser(userId: number) {
  const kv = await getKv();
  const user = await kv.get<UserData>(["ViBot", "userId:", userId]);
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

export async function deleteUser(userId: number) {
  const kv = await getKv();
  await kv.delete(["ViBot", "userId:", userId]);
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
