"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import type { Subscription } from "@/lib/types";
import { daysUntil } from "@/lib/format";

const TABS = [
  { href: "/", label: "Gastos", icon: "📋" },
  { href: "/resumen", label: "Resumen", icon: "📊" },
  { href: "/suscripciones", label: "Suscripciones", icon: "🔁" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [hasUpcomingRenewal, setHasUpcomingRenewal] = useState(false);

  useEffect(() => {
    const client = pb();
    if (!client.authStore.isValid) return;
    client
      .collection("subscriptions")
      .getFullList<Subscription>({ filter: 'status = "activa"' })
      .then((subs) => setHasUpcomingRenewal(subs.some((s) => daysUntil(s.next_renewal) <= 7)))
      .catch(() => {});
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md border-t border-gray-100 bg-white">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const showBadge = tab.href === "/suscripciones" && hasUpcomingRenewal;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              active ? "text-brand" : "text-gray-400"
            }`}
          >
            <span className="relative text-lg">
              {tab.icon}
              {showBadge && (
                <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
