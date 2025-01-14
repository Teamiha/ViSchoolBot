import { getKv } from "../botStatic/kvClient.ts";
import { UserData } from "./mainDB.ts";

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
