import type { RecordModel } from "pocketbase";

export interface Category extends RecordModel {
  name: string;
  icon: string;
  color: string;
}

export interface Tag extends RecordModel {
  name: string;
}

export interface Expense extends RecordModel {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  note: string;
  receipt: string;
  tags: string[];
  expand?: {
    category?: Category;
    tags?: Tag[];
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
