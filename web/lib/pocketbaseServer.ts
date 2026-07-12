import PocketBase from "pocketbase";

let client: PocketBase | null = null;

export async function pbServer(): Promise<PocketBase> {
  if (!client) {
    client = new PocketBase(process.env.NEXT_PUBLIC_PB_URL);
  }

  if (!client.authStore.isValid) {
    const email = process.env.PB_APP_EMAIL;
    const password = process.env.PB_APP_PASSWORD;
    if (!email || !password) {
      throw new Error("PB_APP_EMAIL / PB_APP_PASSWORD no configuradas");
    }
    await client.collection("users").authWithPassword(email, password);
  }

  return client;
}
