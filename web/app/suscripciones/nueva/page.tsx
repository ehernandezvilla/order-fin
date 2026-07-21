"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SubscriptionForm } from "@/components/SubscriptionForm";

function NewSubscriptionForm() {
  const searchParams = useSearchParams();
  const expenseId = searchParams.get("expenseId") ?? undefined;
  const name = searchParams.get("name") ?? undefined;
  const amount = searchParams.get("amount") ?? undefined;
  const nextRenewal = searchParams.get("nextRenewal") ?? undefined;

  return (
    <SubscriptionForm
      linkExpenseId={expenseId}
      initialName={name}
      initialAmount={amount}
      initialNextRenewal={nextRenewal}
    />
  );
}

export default function NewSubscriptionPage() {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <Link href="/suscripciones" className="text-xl text-gray-400">
          ←
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Nueva suscripción</h1>
      </header>

      <Suspense fallback={<p className="px-6 py-10 text-center text-sm text-gray-400">Cargando...</p>}>
        <NewSubscriptionForm />
      </Suspense>
    </>
  );
}
