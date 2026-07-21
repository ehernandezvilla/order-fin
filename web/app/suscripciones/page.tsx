"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import type { Subscription } from "@/lib/types";
import { SubscriptionSummary } from "@/components/SubscriptionSummary";
import { SubscriptionList } from "@/components/SubscriptionList";
import { BottomNav } from "@/components/BottomNav";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) {
      window.location.href = "/login";
      return;
    }
    client
      .collection("subscriptions")
      .getFullList<Subscription>({ sort: "next_renewal" })
      .then(setSubscriptions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="flex items-center justify-between px-6 pt-6">
        <h1 className="text-lg font-semibold text-gray-900">Suscripciones</h1>
      </header>

      {loading ? (
        <p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>
      ) : (
        <div className="mt-4">
          <SubscriptionSummary subscriptions={subscriptions} />
          <SubscriptionList subscriptions={subscriptions} />
        </div>
      )}

      <Link
        href="/suscripciones/nueva"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-3xl font-light text-white shadow-lg"
      >
        +
      </Link>

      <BottomNav />
    </>
  );
}
