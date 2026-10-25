"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  CURRENT_BALANCE,
  DEBTS,
  INCOMING_MONEY,
  MONTHLY_SUMMARY,
  PAYMENT_HISTORY,
  SAVINGS_BALANCE,
  type Debt,
  type DebtStatus,
  type PaymentMethod,
} from "@/lib/mock-data";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  initials,
} from "@/lib/utils";

// ============================================================
// FinanceView — money management interface
// ============================================================
//
// ⚠ Demo data — see src/lib/mock-data.ts. All figures are mock.
//   Local interactions (mark-as-paid, add/withdraw) update local
//   state only; refresh resets everything. Database wiring lands
//   in milestone 2 with Supabase.
//
// Sections (top → bottom):
//   1. Header — title + demo badge
//   2. Balance cards — current, savings, monthly summary
//   3. Mini stat row — total outstanding + total incoming
//   4. Money owed to me — list with mark-as-paid confirmation flow
//   5. Two-column — expected incoming + payment history

export function FinanceView() {
  // Local state. These start as the demo data and can be mutated
  // locally (mark-as-paid moves a debt into the payments list and
  // credits the balance). Refresh resets everything to the mock.
  const [debts, setDebts] = useState<Debt[]>(DEBTS);
  const [payments, setPayments] = useState(PAYMENT_HISTORY);
  const [currentBalance, setCurrentBalance] = useState(CURRENT_BALANCE);

  // Which debt (if any) is in the mark-as-paid confirmation dialog
  const [confirmingDebtId, setConfirmingDebtId] = useState<string | null>(null);
  const confirmingDebt = debts.find((d) => d.id === confirmingDebtId) ?? null;

  // Mark a debt as paid: remove from debts, prepend to payments,
  // credit the outstanding amount to the current balance.
  const handleConfirmPaid = () => {
    if (!confirmingDebt) return;
    const paidAmount = confirmingDebt.outstanding;
    setDebts((prev) => prev.filter((d) => d.id !== confirmingDebt.id));
    setPayments((prev) => [
      {
        id: `pay-${Date.now()}`,
        personName: confirmingDebt.personName,
        amount: paidAmount,
        receivedAt: new Date().toISOString(),
        method: "wallet",
        note: confirmingDebt.note,
      },
      ...prev,
    ]);
    setCurrentBalance((b) => b + paidAmount);
    setConfirmingDebtId(null);
  };

  // Recompute totals whenever the local debts change.
  const totalOutstanding = useMemo(
    () => debts.reduce((s, d) => s + d.outstanding, 0),
    [debts],
  );
  const totalIncoming = useMemo(
    () =>
      INCOMING_MONEY.filter((i) => i.status === "scheduled").reduce(
        (s, i) => s + i.amount,
        0,
      ),
    [],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 sm:p-10">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-quaternary">
          Section
        </p>
        <h1 className="text-3xl font-light tracking-tight text-ink-primary sm:text-4xl">
          Finance
        </h1>
        <p className="flex items-center gap-2 text-[13px] text-ink-tertiary">
          <span className="inline-block h-1 w-1 rounded-full bg-amber-400/60" />
          Demo data · Local changes only · Refresh resets
        </p>
      </motion.section>

      {/* Balance cards */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-3 md:grid-cols-3"
      >
        <BalanceCard
          label="Current Balance"
          amount={currentBalance}
          icon={Wallet}
          accent="emerald"
          actions={[
            { label: "Add", icon: Plus, onClick: () => {} },
            { label: "Withdraw", icon: ArrowUpRight, onClick: () => {} },
          ]}
        />
        <BalanceCard
          label="Savings"
          amount={SAVINGS_BALANCE}
          icon={TrendingUp}
          actions={[
            { label: "Add", icon: Plus, onClick: () => {} },
            { label: "Withdraw", icon: ArrowUpRight, onClick: () => {} },
          ]}
        />
        <MonthlySummaryCard />
      </motion.section>

      {/* Mini stat row — total outstanding + total incoming */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <MiniStat
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={ArrowDownLeft}
          accent="warning"
        />
        <MiniStat
          label="Expected Incoming"
          value={formatCurrency(totalIncoming)}
          icon={ArrowUpRight}
          accent="emerald"
        />
      </motion.section>

      {/* Money owed to me */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign
              className="h-4 w-4 text-emerald-300"
              strokeWidth={1.5}
            />
            <h2 className="text-[13px] font-medium text-ink-primary">
              Money Owed to Me
            </h2>
            <span className="font-mono text-[10px] tabular text-ink-tertiary">
              {debts.length}
            </span>
          </div>
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-surface-panel/40 px-3 py-1.5 text-[11px] text-ink-secondary transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Plus className="h-3 w-3" strokeWidth={1.5} />
            Add debt
          </button>
        </div>
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Check
              className="h-6 w-6 text-emerald-300/60"
              strokeWidth={1.5}
            />
            <p className="text-[13px] text-ink-tertiary">
              All settled. No outstanding debts.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {debts.map((debt) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                onMarkPaid={() => setConfirmingDebtId(debt.id)}
              />
            ))}
          </ul>
        )}
      </motion.section>

      {/* Two-column — expected incoming + payment history */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <ArrowDownLeft
              className="h-4 w-4 text-emerald-300"
              strokeWidth={1.5}
            />
            <h2 className="text-[13px] font-medium text-ink-primary">
              Expected Incoming
            </h2>
          </div>
          <ul className="flex flex-col gap-1">
            {INCOMING_MONEY.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink-primary">
                    {item.source}
                  </p>
                  <p className="truncate text-[11px] text-ink-tertiary">
                    {formatRelativeTime(item.expectedDate)}
                    {item.note ? ` · ${item.note}` : ""}
                  </p>
                </div>
                <span className="font-mono text-[13px] tabular text-emerald-300">
                  +{formatCurrency(item.amount)}
                </span>
                <IncomingStatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-xl border border-line-subtle bg-surface-panel/40 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock
              className="h-4 w-4 text-emerald-300"
              strokeWidth={1.5}
            />
            <h2 className="text-[13px] font-medium text-ink-primary">
              Payment History
            </h2>
            <span className="font-mono text-[10px] tabular text-ink-tertiary">
              {payments.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {payments.slice(0, 8).map((payment) => (
              <li
                key={payment.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-subtle bg-surface-elevated">
                  <span className="font-mono text-[9px] font-medium uppercase tracking-wide text-ink-secondary">
                    {initials(payment.personName)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink-primary">
                    {payment.personName}
                  </p>
                  <p className="truncate text-[11px] text-ink-tertiary">
                    {formatDate(payment.receivedAt, {
                      month: "short",
                      day: "numeric",
                    })}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <PaymentMethodBadge method={payment.method} />
                <span className="font-mono text-[13px] tabular text-ink-secondary">
                  +{formatCurrency(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      {/* Mark-as-paid confirmation dialog */}
      <AnimatePresence>
        {confirmingDebt && (
          <ConfirmPaidDialog
            debt={confirmingDebt}
            onCancel={() => setConfirmingDebtId(null)}
            onConfirm={handleConfirmPaid}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Balance card ---------------------------------------------------------

interface BalanceAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface BalanceCardProps {
  label: string;
  amount: number;
  icon: LucideIcon;
  accent?: "emerald" | "default";
  actions: BalanceAction[];
}

function BalanceCard({
  label,
  amount,
  icon: Icon,
  accent = "default",
  actions,
}: BalanceCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line-subtle bg-surface-panel/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-ink-tertiary">
          {label}
        </span>
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            accent === "emerald" ? "text-emerald-300" : "text-ink-tertiary",
          )}
          strokeWidth={1.5}
        />
      </div>
      <span
        className={cn(
          "font-mono text-[26px] font-light tabular",
          accent === "emerald" ? "text-emerald-300" : "text-ink-primary",
        )}
      >
        {formatCurrency(amount)}
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line-subtle bg-surface-panel/60 px-3 py-1.5 text-[11px] text-ink-secondary transition-all hover:border-line-strong hover:bg-surface-elevated hover:text-ink-primary"
          >
            <action.icon className="h-3 w-3" strokeWidth={1.5} />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Monthly summary card -------------------------------------------------

function MonthlySummaryCard() {
  const { income, expenses, net } = MONTHLY_SUMMARY;
  const isPositive = net >= 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-panel/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-ink-tertiary">
          Monthly Summary
        </span>
        <CalendarClock
          className="h-3.5 w-3.5 text-ink-tertiary"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <SummaryRow
          label="Income"
          amount={income}
          icon={TrendingUp}
          color="text-emerald-300"
        />
        <SummaryRow
          label="Expenses"
          amount={expenses}
          icon={TrendingDown}
          color="text-status-danger"
        />
        <div className="my-1 h-px bg-line-subtle" />
        <SummaryRow
          label="Net"
          amount={net}
          icon={isPositive ? ArrowUpRight : ArrowDownLeft}
          color={isPositive ? "text-emerald-300" : "text-status-danger"}
          emphasize
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  amount,
  icon: Icon,
  color,
  emphasize,
}: {
  label: string;
  amount: number;
  icon: LucideIcon;
  color: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "flex items-center gap-2 text-[12px]",
          emphasize ? "font-medium text-ink-primary" : "text-ink-tertiary",
        )}
      >
        <Icon className={cn("h-3 w-3", color)} strokeWidth={1.5} />
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[13px] tabular",
          emphasize ? color : "text-ink-secondary",
        )}
      >
        {amount >= 0 ? "+" : "−"}
        {formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}

// --- Mini stat -----------------------------------------------------------

function MiniStat({
  label,
  value,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "emerald" | "warning" | "default";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line-subtle bg-surface-panel/40 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-widest text-ink-tertiary">
          {label}
        </span>
        <span className="font-mono text-[18px] font-light tabular text-ink-primary">
          {value}
        </span>
      </div>
      <Icon
        className={cn(
          "h-4 w-4",
          accent === "emerald"
            ? "text-emerald-300"
            : accent === "warning"
              ? "text-status-warning"
              : "text-ink-tertiary",
        )}
        strokeWidth={1.5}
      />
    </div>
  );
}

// --- Debt row -------------------------------------------------------------

const DEBT_STATUS_LABEL: Record<DebtStatus, string> = {
  pending: "Pending",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
};

const DEBT_STATUS_STYLES: Record<DebtStatus, string> = {
  pending: "bg-surface-elevated text-ink-tertiary border-line-subtle",
  partial: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-300 border-red-500/20",
};

function DebtRow({
  debt,
  onMarkPaid,
}: {
  debt: Debt;
  onMarkPaid: () => void;
}) {
  const isPartial = debt.outstanding < debt.amount;
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-hover/40">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-subtle bg-surface-elevated">
        <span className="font-mono text-[9px] font-medium uppercase tracking-wide text-ink-secondary">
          {initials(debt.personName)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-primary">
          {debt.personName}
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {debt.note ?? "—"} · Due {formatRelativeTime(debt.dueDate)}
        </p>
      </div>
      <span className="font-mono text-[13px] tabular text-ink-primary">
        {formatCurrency(debt.outstanding)}
        {isPartial && (
          <span className="ml-1 text-[10px] text-ink-quaternary">
            / {formatCurrency(debt.amount)}
          </span>
        )}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest",
          DEBT_STATUS_STYLES[debt.status],
        )}
      >
        {DEBT_STATUS_LABEL[debt.status]}
      </span>
      <button
        onClick={onMarkPaid}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line-subtle bg-surface-panel/60 text-ink-tertiary transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
        title="Mark as paid"
        aria-label={`Mark ${debt.personName}'s debt as paid`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </li>
  );
}

// --- Status badges --------------------------------------------------------

function IncomingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    received: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    delayed: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };
  const cls =
    styles[status] ??
    "bg-surface-elevated text-ink-tertiary border-line-subtle";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest",
        cls,
      )}
    >
      {status}
    </span>
  );
}

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className="shrink-0 rounded-md border border-line-subtle bg-surface-panel/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-tertiary">
      {method}
    </span>
  );
}

// --- Confirm paid dialog -------------------------------------------------

function ConfirmPaidDialog({
  debt,
  onCancel,
  onConfirm,
}: {
  debt: Debt;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onCancel}
        className="absolute inset-0 bg-surface-void/70 backdrop-blur-sm"
      />
      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-line-default bg-surface-panel/95 shadow-elev-4 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <Check
                className="h-3.5 w-3.5 text-emerald-300"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-[13px] font-medium text-ink-primary">
              Mark as Paid
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Confirm that{" "}
            <span className="font-medium text-ink-primary">
              {debt.personName}
            </span>{" "}
            has paid the outstanding balance of{" "}
            <span className="font-mono text-emerald-300">
              {formatCurrency(debt.outstanding)}
            </span>
            .
          </p>
          {debt.note && (
            <p className="mt-2 text-[11px] text-ink-tertiary">
              Note: {debt.note}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <AlertTriangle
              className="h-3 w-3 shrink-0 text-amber-300"
              strokeWidth={1.5}
            />
            <p className="text-[11px] text-amber-300/80">
              Demo only — this change is local. Refresh resets.
            </p>
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-line-subtle px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-line-subtle bg-surface-panel/60 px-3 py-1.5 text-[12px] text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-medium text-emerald-300 transition-all hover:bg-emerald-500/20 hover:shadow-glow-sm"
          >
            <Check className="h-3 w-3" strokeWidth={1.5} />
            Confirm payment
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
