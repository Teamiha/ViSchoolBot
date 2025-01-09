let kvInstance: Deno.Kv | null = null;

export async function getKv() {
  if (!kvInstance) {
    kvInstance = await Deno.openKv();
  }
  return kvInstance;
}

export async function closeKv() {
  if (kvInstance) {
    await kvInstance.close();
    kvInstance = null;
  }
}
