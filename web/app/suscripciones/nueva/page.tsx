"use client";

import Link from "next/link";
import { SubscriptionForm } from "@/components/SubscriptionForm";

export default function NewSubscriptionPage() {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <Link href="/suscripciones" className="text-xl text-gray-400">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Nueva suscripción</h1>
      </header>

      <SubscriptionForm />
    </>
  );
}
