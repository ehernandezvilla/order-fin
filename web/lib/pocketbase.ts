import PocketBase from "pocketbase";

let client: PocketBase | null = null;

export function pb(): PocketBase {
  if (typeof window === "undefined") {
    throw new Error("pb() must be called from a client component");
  }

  if (!client) {
    client = new PocketBase(process.env.NEXT_PUBLIC_PB_URL);
    client.authStore.loadFromCookie(document.cookie);
    client.authStore.onChange(() => {
      document.cookie = client!.authStore.exportToCookie({ httpOnly: false });
    });
  }

  return client;
}
