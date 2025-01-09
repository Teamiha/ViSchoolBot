import { getKv } from "./botStatic/kvClient.ts";

export interface UserData {
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
    if (!user.value) {
      await createNewUser(userId);
      const newUserData = await kv.get(["ViBot", "userId:", userId]);
      console.log("new user");
      return newUserData;
    }
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

  export async function grantAccess(userId: number) {
    const kv = await getKv();
  
    const result = await kv.get<number[]>(["ViBot", "accessList"]);
    const accessList = result.value || [];
  
    if (!accessList.includes(userId)) {
      accessList.push(userId);
      await kv.set(["ViBot", "accessList"], accessList);
    }
  }

  export async function revokeAccess(userId: number) {
    const kv = await getKv();
  
    const result = await kv.get<number[]>(["ViBot", "accessList"]);
    const accessList = result.value || [];
  
    const updatedList = accessList.filter((id) => id !== userId);
  
    await kv.set(["ViBot", "accessList"], updatedList);
    await kv.delete(["ViBot", "userId:", userId]);
  }

  export async function hasAccess(userId: number): Promise<boolean> {
    const kv = await getKv();
  
    const result = await kv.get<number[]>(["ViBot", "accessList"]);
    const accessList = result.value || [];
  
    return accessList.includes(userId);
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