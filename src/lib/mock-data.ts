// ============================================================
// NEGM OS — Demo dataset (clearly labeled mock data)
// ============================================================
//
// ⚠️  EVERYTHING IN THIS FILE IS DEMO DATA.
//
// These values are NOT connected to a real database. They exist only
// to render a believable cinematic interface for the first deployment.
// In milestone 2, we'll replace these with Supabase queries and the
// shapes defined here will become the row types for the database.
//
// All dates are computed relative to `now` at module load time, so the
// home view always shows fresh "upcoming" items regardless of when
// you open the OS.

export const IS_DEMO_DATA = true;

// --- Types ----------------------------------------------------------------

export type DebtStatus = "pending" | "partial" | "paid" | "overdue";

export interface Debt {
  id: string;
  personName: string;
  /** Initial amount owed, in major currency units (e.g. dollars). */
  amount: number;
  /** Amount still outstanding. Equal to amount minus any partial payments. */
  outstanding: number;
  /** ISO datetime string — when the debt is due. */
  dueDate: string;
  /** Free-form context, shown as a sub-line in the list. */
  note?: string;
  status: DebtStatus;
  /** ISO timestamp of creation, for sorting. */
  createdAt: string;
}

export type IncomingStatus = "scheduled" | "received" | "delayed";

export interface IncomingMoney {
  id: string;
  source: string;
  amount: number;
  expectedDate: string;
  status: IncomingStatus;
  note?: string;
}

export type PaymentMethod = "cash" | "bank" | "wallet" | "card";

export interface PaymentRecord {
  id: string;
  personName: string;
  amount: number;
  receivedAt: string;
  method: PaymentMethod;
  note?: string;
}

export type EventType =
  | "shift"
  | "lecture"
  | "appointment"
  | "personal"
  | "reminder";

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO datetime string for start. */
  start: string;
  /** ISO datetime string for end. */
  end: string;
  type: EventType;
  location?: string;
  note?: string;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  completed: boolean;
  note?: string;
}

export type ActivityKind = "payment" | "debt" | "task" | "calendar" | "system";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  description: string;
  timestamp: string;
}

// --- Date helpers (relative to "now") --------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * daysFromNow — returns an ISO datetime anchored to today's calendar day
 * at a specific hour/minute, then shifted by N days.
 *
 *   daysFromNow(0, 7, 30)  // today at 07:30
 *   daysFromNow(1, 9, 0)   // tomorrow at 09:00
 *   daysFromNow(-2, 14)    // two days ago at 14:00
 */
function daysFromNow(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Date(d.getTime() + days * DAY_MS).toISOString();
}

// --- Balances --------------------------------------------------------------

export const CURRENT_BALANCE = 8420.5;
export const SAVINGS_BALANCE = 24150.0;

export const MONTHLY_SUMMARY = {
  income: 3250.0,
  expenses: 1840.0,
  net: 1410.0,
  // Used by the home view's "financial overview" sparkline.
  trend: [1820, 2150, 1980, 2410, 2680, 3250] as number[],
};

// --- Money owed to me ------------------------------------------------------

export const DEBTS: Debt[] = [
  {
    id: "debt-1",
    personName: "Sara Khaled",
    amount: 750,
    outstanding: 750,
    dueDate: daysFromNow(2),
    note: "October rent share",
    status: "pending",
    createdAt: daysFromNow(-12),
  },
  {
    id: "debt-2",
    personName: "Omar Tarek",
    amount: 1200,
    outstanding: 400,
    dueDate: daysFromNow(5),
    note: "Car repair reimbursement",
    status: "partial",
    createdAt: daysFromNow(-8),
  },
  {
    id: "debt-3",
    personName: "Layla Mostafa",
    amount: 320,
    outstanding: 320,
    dueDate: daysFromNow(-1),
    note: "Concert tickets",
    status: "overdue",
    createdAt: daysFromNow(-15),
  },
  {
    id: "debt-4",
    personName: "Yousef Adel",
    amount: 580,
    outstanding: 580,
    dueDate: daysFromNow(9),
    note: "Shared trip — Cairo",
    status: "pending",
    createdAt: daysFromNow(-3),
  },
];

// --- Incoming money --------------------------------------------------------

export const INCOMING_MONEY: IncomingMoney[] = [
  {
    id: "in-1",
    source: "University stipend",
    amount: 1500,
    expectedDate: daysFromNow(3),
    status: "scheduled",
    note: "October disbursement",
  },
  {
    id: "in-2",
    source: "Freelance — A. Hassan",
    amount: 850,
    expectedDate: daysFromNow(6),
    status: "scheduled",
    note: "Design system delivery",
  },
  {
    id: "in-3",
    source: "Family support",
    amount: 400,
    expectedDate: daysFromNow(-2),
    status: "delayed",
    note: "Awaiting transfer",
  },
];

// --- Payment history -------------------------------------------------------

export const PAYMENT_HISTORY: PaymentRecord[] = [
  {
    id: "pay-1",
    personName: "Mariam Saad",
    amount: 250,
    receivedAt: daysFromNow(-2, 14),
    method: "wallet",
    note: "Partial — restaurant split",
  },
  {
    id: "pay-2",
    personName: "Omar Tarek",
    amount: 800,
    receivedAt: daysFromNow(-5, 19),
    method: "bank",
    note: "Car repair — first installment",
  },
  {
    id: "pay-3",
    personName: "Hana Youssef",
    amount: 120,
    receivedAt: daysFromNow(-9, 11),
    method: "cash",
  },
  {
    id: "pay-4",
    personName: "Karim Nabil",
    amount: 430,
    receivedAt: daysFromNow(-14, 16),
    method: "wallet",
    note: "Shared groceries",
  },
  {
    id: "pay-5",
    personName: "Sara Khaled",
    amount: 600,
    receivedAt: daysFromNow(-21, 9),
    method: "bank",
    note: "September rent share",
  },
];

// --- Calendar events (this week + a few anchors) -------------------------

export const CALENDAR_EVENTS: CalendarEvent[] = [
  // Work shifts
  {
    id: "evt-1",
    title: "Morning shift — Clinic",
    start: daysFromNow(0, 7, 30),
    end: daysFromNow(0, 13, 0),
    type: "shift",
    location: "Downtown",
  },
  {
    id: "evt-2",
    title: "Evening shift — Clinic",
    start: daysFromNow(2, 16, 0),
    end: daysFromNow(2, 22, 0),
    type: "shift",
    location: "Downtown",
  },
  {
    id: "evt-3",
    title: "Night shift — Clinic",
    start: daysFromNow(4, 20, 0),
    end: daysFromNow(5, 2, 0),
    type: "shift",
    location: "Downtown",
  },
  // University lectures
  {
    id: "evt-4",
    title: "Advanced Pharmacology",
    start: daysFromNow(1, 9, 0),
    end: daysFromNow(1, 11, 0),
    type: "lecture",
    location: "Hall B — Faculty of Medicine",
  },
  {
    id: "evt-5",
    title: "Clinical Pathology",
    start: daysFromNow(3, 10, 0),
    end: daysFromNow(3, 12, 0),
    type: "lecture",
    location: "Hall C",
  },
  {
    id: "evt-6",
    title: "Anatomy lab",
    start: daysFromNow(5, 13, 0),
    end: daysFromNow(5, 16, 0),
    type: "lecture",
    location: "Lab 4 — Dissection hall",
  },
  // Appointments
  {
    id: "evt-7",
    title: "Dentist — Dr. Mona",
    start: daysFromNow(6, 15, 0),
    end: daysFromNow(6, 15, 30),
    type: "appointment",
    location: "Smile Clinic — Nasr City",
  },
  // Personal
  {
    id: "evt-8",
    title: "Gym session",
    start: daysFromNow(1, 18, 0),
    end: daysFromNow(1, 19, 30),
    type: "personal",
    location: "Gold's Gym",
  },
  {
    id: "evt-9",
    title: "Family dinner",
    start: daysFromNow(2, 20, 0),
    end: daysFromNow(2, 22, 30),
    type: "personal",
    location: "Home",
  },
  // Reminders
  {
    id: "evt-10",
    title: "Renew car registration",
    start: daysFromNow(7, 10, 0),
    end: daysFromNow(7, 10, 15),
    type: "reminder",
    note: "Traffic office — Maadi",
  },
];

// --- Tasks -----------------------------------------------------------------

export const TASKS: Task[] = [
  {
    id: "task-1",
    title: "Submit clinical case report",
    dueDate: daysFromNow(1, 23),
    priority: "urgent",
    completed: false,
    note: "Cardiology rotation",
  },
  {
    id: "task-2",
    title: "Prepare pharmacology slides",
    dueDate: daysFromNow(2, 9),
    priority: "high",
    completed: false,
  },
  {
    id: "task-3",
    title: "Pay electricity bill",
    dueDate: daysFromNow(3, 18),
    priority: "medium",
    completed: false,
  },
  {
    id: "task-4",
    title: "Call insurance provider",
    dueDate: daysFromNow(0, 17),
    priority: "high",
    completed: false,
    note: "Policy renewal",
  },
  {
    id: "task-5",
    title: "Review anatomy notes",
    dueDate: daysFromNow(4, 20),
    priority: "low",
    completed: false,
  },
  {
    id: "task-6",
    title: "Buy birthday gift — Hana",
    dueDate: daysFromNow(5, 12),
    priority: "medium",
    completed: false,
  },
  {
    id: "task-7",
    title: "Backup laptop to external drive",
    priority: "low",
    completed: true,
  },
  {
    id: "task-8",
    title: "Schedule dentist appointment",
    priority: "medium",
    completed: true,
    note: "Done — booked for Saturday",
  },
];

// --- Recent activity feed -------------------------------------------------

export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    kind: "payment",
    description: "Received $250 from Mariam Saad",
    timestamp: daysFromNow(-2, 14),
  },
  {
    id: "act-2",
    kind: "task",
    description: "Completed: Schedule dentist appointment",
    timestamp: daysFromNow(-2, 11),
  },
  {
    id: "act-3",
    kind: "debt",
    description: "New debt recorded — Yousef Adel, $580",
    timestamp: daysFromNow(-3, 9),
  },
  {
    id: "act-4",
    kind: "calendar",
    description: "Evening shift confirmed for Wednesday",
    timestamp: daysFromNow(-4, 16),
  },
  {
    id: "act-5",
    kind: "payment",
    description: "Received $800 from Omar Tarek",
    timestamp: daysFromNow(-5, 19),
  },
  {
    id: "act-6",
    kind: "system",
    description: "NEGM OS booted successfully",
    timestamp: daysFromNow(-5, 8),
  },
];

// --- Derived aggregates (for the home view's stat cards) ------------------

export const TOTAL_OUTSTANDING = DEBTS.reduce((sum, d) => sum + d.outstanding, 0);
export const TOTAL_INCOMING = INCOMING_MONEY.filter((i) => i.status === "scheduled").reduce(
  (sum, i) => sum + i.amount,
  0,
);

// --- Single aggregate export (one import per component) -------------------

export const DEMO_DATA = {
  isDemo: IS_DEMO_DATA,
  balances: {
    current: CURRENT_BALANCE,
    savings: SAVINGS_BALANCE,
  },
  monthlySummary: MONTHLY_SUMMARY,
  debts: DEBTS,
  incoming: INCOMING_MONEY,
  payments: PAYMENT_HISTORY,
  events: CALENDAR_EVENTS,
  tasks: TASKS,
  activity: RECENT_ACTIVITY,
  totals: {
    outstanding: TOTAL_OUTSTANDING,
    incoming: TOTAL_INCOMING,
  },
} as const;
