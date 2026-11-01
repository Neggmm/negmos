import { supabase } from "./client";
import type {
  Task,
  TaskPriority,
  Debt,
  DebtStatus,
  PaymentRecord,
  PaymentMethod,
  CalendarEvent,
  EventType,
  IncomingMoney,
  IncomingStatus,
  ActivityItem,
  ActivityKind,
} from "@/lib/mock-data";

// ============================================================
// NEGM OS — Supabase query helpers
// ============================================================
//
// Single source of truth for data fetching. Each function:
//   - Returns typed data (matches the existing mock-data.ts types)
//   - Returns [] or null on error (with console.error)
//   - Filters by the authenticated user automatically (RLS handles this)
//
// Type mapping: DB rows use snake_case (person_name, due_date);
// our view-models use camelCase (personName, dueDate). The rowTo*
// functions do the conversion.

// --- Types (re-exported for convenience) ------------------------------

export type {
  Task,
  TaskPriority,
  Debt,
  DebtStatus,
  PaymentRecord,
  PaymentMethod,
  CalendarEvent,
  EventType,
  IncomingMoney,
  IncomingStatus,
  ActivityItem,
  ActivityKind,
};

export interface Profile {
  id: string;
  display_name: string;
  initials: string;
  role: string;
  current_balance: number;
  savings_balance: number;
  preferred_currency: string;
}

// --- Profile ----------------------------------------------------------

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();

  if (error) {
    console.error("[NEGM OS] getProfile error:", error.message);
    return null;
  }

  return {
    ...data,
    current_balance: Number(data.current_balance),
    savings_balance: Number(data.savings_balance),
  } as Profile;
}

// --- Tasks ------------------------------------------------------------

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  completed: boolean;
  completed_at: string | null;
  note: string | null;
  created_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date ?? undefined,
    priority: row.priority,
    completed: row.completed,
    note: row.note ?? undefined,
  };
}

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[NEGM OS] getTasks error:", error.message);
    return [];
  }

  return (data as TaskRow[] ?? []).map(rowToTask);
}

export async function toggleTask(
  id: string,
  completed: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    console.error("[NEGM OS] toggleTask error:", error.message);
    return false;
  }

  return true;
}

// --- Debts ------------------------------------------------------------

interface DebtRow {
  id: string;
  person_name: string;
  amount: string | number;
  outstanding: string | number;
  due_date: string | null;
  note: string | null;
  status: DebtStatus;
  created_at: string;
}

function rowToDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    personName: row.person_name,
    amount: Number(row.amount),
    outstanding: Number(row.outstanding),
    dueDate: row.due_date ?? new Date().toISOString(),
    note: row.note ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[NEGM OS] getDebts error:", error.message);
    return [];
  }

  return (data as DebtRow[] ?? []).map(rowToDebt);
}

export async function markDebtAsPaid(
  id: string,
): Promise<{ success: boolean; outstanding: number }> {
  // Fetch the debt to get the outstanding amount (needed to credit the balance)
  const { data: debt, error: fetchError } = await supabase
    .from("debts")
    .select("outstanding")
    .eq("id", id)
    .single();

  if (fetchError || !debt) {
    console.error("[NEGM OS] markDebtAsPaid fetch error:", fetchError?.message);
    return { success: false, outstanding: 0 };
  }

  const outstanding = Number(debt.outstanding);

  // Mark the debt as paid
  const { error: updateError } = await supabase
    .from("debts")
    .update({ status: "paid", outstanding: 0 })
    .eq("id", id);

  if (updateError) {
    console.error("[NEGM OS] markDebtAsPaid update error:", updateError.message);
    return { success: false, outstanding: 0 };
  }

  return { success: true, outstanding };
}

// --- Payments ---------------------------------------------------------

interface PaymentRow {
  id: string;
  person_name: string;
  amount: string | number;
  received_at: string;
  method: PaymentMethod;
  note: string | null;
}

function rowToPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    personName: row.person_name,
    amount: Number(row.amount),
    receivedAt: row.received_at,
    method: row.method,
    note: row.note ?? undefined,
  };
}

export async function getPayments(limit: number = 20): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[NEGM OS] getPayments error:", error.message);
    return [];
  }

  return (data as PaymentRow[] ?? []).map(rowToPayment);
}

// --- Calendar Events --------------------------------------------------

interface EventRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: EventType;
  location: string | null;
  note: string | null;
}

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    type: row.type,
    location: row.location ?? undefined,
    note: row.note ?? undefined,
  };
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[NEGM OS] getCalendarEvents error:", error.message);
    return [];
  }

  return (data as EventRow[] ?? []).map(rowToEvent);
}

// --- Incoming Money ---------------------------------------------------

interface IncomingRow {
  id: string;
  source: string;
  amount: string | number;
  expected_date: string | null;
  status: IncomingStatus;
  note: string | null;
}

function rowToIncoming(row: IncomingRow): IncomingMoney {
  return {
    id: row.id,
    source: row.source,
    amount: Number(row.amount),
    expectedDate: row.expected_date ?? new Date().toISOString(),
    status: row.status,
    note: row.note ?? undefined,
  };
}

export async function getIncomingMoney(): Promise<IncomingMoney[]> {
  const { data, error } = await supabase
    .from("incoming_money")
    .select("*")
    .order("expected_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[NEGM OS] getIncomingMoney error:", error.message);
    return [];
  }

  return (data as IncomingRow[] ?? []).map(rowToIncoming);
}

// --- Activity Log -----------------------------------------------------

interface ActivityRow {
  id: string;
  kind: ActivityKind;
  description: string;
  created_at: string;
}

function rowToActivity(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    kind: row.kind,
    description: row.description,
    timestamp: row.created_at,
  };
}

export async function getActivityLog(
  limit: number = 20,
): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[NEGM OS] getActivityLog error:", error.message);
    return [];
  }

  return (data as ActivityRow[] ?? []).map(rowToActivity);
}

// --- Profile mutations (for mark-as-paid balance credit) --------------

export async function creditCurrentBalance(
  amount: number,
): Promise<boolean> {
  // Fetch current balance
  const profile = await getProfile();
  if (!profile) return false;

  const newBalance = profile.current_balance + amount;

  const { error } = await supabase
    .from("profiles")
    .update({ current_balance: newBalance })
    .eq("id", profile.id);

  if (error) {
    console.error("[NEGM OS] creditCurrentBalance error:", error.message);
    return false;
  }

  return true;
}
