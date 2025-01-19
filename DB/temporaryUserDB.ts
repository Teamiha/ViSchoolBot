import { getKv } from "../botStatic/kvClient.ts";
import { REGISTRATION_TIMEOUT } from "../botStatic/const.ts";
import { UserData } from "./mainDB.ts";

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
    courseHistory: [],
    hwoRegistered: "",
    registrationDate: "",
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
