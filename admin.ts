import { getKv } from "./botStatic/kvClient.ts";
import { UserData } from "./db.ts";

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

// listAllViBotRecords();
