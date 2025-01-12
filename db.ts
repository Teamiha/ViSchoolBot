import { getKv } from "./botStatic/kvClient.ts";
import { REGISTRATION_TIMEOUT } from "./botStatic/const.ts";

export interface UserData {
  paymentInProcess: boolean;
  nickName: string;
  name: string;
  birthday: string;
  school: string;
  class: string;
  courses: string;
  hwoRegistered: string;
  notes: string;
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
    courses: "",
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

export async function getAllUserNames(): Promise<string[]> {
  const kv = await getKv();
  const users = kv.list<UserData>({ prefix: ["ViBot", "userId:"] });
  const names: string[] = [];

  for await (const user of users) {
    if (user.value && user.value.name) {
      names.push(user.value.name);
    }
  }

  return names;
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
  } catch (error) {
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
    courses: "",
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
