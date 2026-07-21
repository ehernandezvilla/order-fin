import type { RecordModel } from "pocketbase";

export interface Category extends RecordModel {
  name: string;
  icon: string;
  color: string;
}

export interface Tag extends RecordModel {
  name: string;
}

export type BillingCycle = "mensual" | "trimestral" | "semestral" | "anual";
export type SubscriptionStatus = "activa" | "pausada" | "cancelada";

export interface Subscription extends RecordModel {
  name: string;
  owner: string;
  amount: number;
  billing_cycle: BillingCycle;
  next_renewal: string;
  status: SubscriptionStatus;
  notes: string;
}

export interface Expense extends RecordModel {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  note: string;
  receipt: string;
  tags: string[];
  subscription: string;
  expand?: {
    category?: Category;
    tags?: Tag[];
    subscription?: Subscription;
  };
}

export interface ApiKey extends RecordModel {
  name: string;
  prefix: string;
  hash: string;
  last_used: string;
}

export interface ExtractedReceipt {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  suggested_category: string | null;
}
