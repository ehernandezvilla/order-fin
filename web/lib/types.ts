import type { RecordModel } from "pocketbase";

export interface Category extends RecordModel {
  name: string;
  icon: string;
  color: string;
}

export interface Expense extends RecordModel {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  note: string;
  receipt: string;
  expand?: {
    category?: Category;
  };
}

export interface ExtractedReceipt {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  suggested_category: string | null;
}
