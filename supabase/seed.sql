-- ============================================================
-- NEGM OS — Seed data (Milestone 2.2)
-- ============================================================
--
-- Run this ONCE in:
--   Supabase Dashboard → SQL Editor → New query → Paste → Run
--
-- Inserts test data for the user identified by email below.
-- Replace the email in the WHERE clauses if you used a different one.
--
-- WARNING: Running this multiple times will create duplicates.
-- To re-seed, first delete the data via Table Editor, then re-run.
-- ============================================================

-- IMPORTANT: Replace this email if you used a different one
-- (used to find your user_id automatically)

-- ============================================================
-- Tasks
-- ============================================================
insert into public.tasks (user_id, title, due_date, priority, completed, completed_at, note)
select u.id, s.title, s.due_date, s.priority, s.completed, s.completed_at, s.note
from (
  select 'Submit clinical case report' as title,
         (now() + interval '1 day')::timestamptz as due_date,
         'urgent' as priority, false as completed,
         null::timestamptz as completed_at,
         'Cardiology rotation' as note
  union all select 'Prepare pharmacology slides',
         (now() + interval '2 days')::timestamptz,
         'high', false, null, null
  union all select 'Pay electricity bill',
         (now() + interval '3 days')::timestamptz,
         'medium', false, null, null
  union all select 'Call insurance provider',
         (now() + interval '4 hours')::timestamptz,
         'high', false, null, 'Policy renewal'
  union all select 'Review anatomy notes',
         (now() + interval '4 days')::timestamptz,
         'low', false, null, null
  union all select 'Buy birthday gift — Hana',
         (now() + interval '5 days')::timestamptz,
         'medium', false, null, null
  union all select 'Backup laptop to external drive',
         null::timestamptz,
         'low', true,
         (now() - interval '2 days')::timestamptz, null
  union all select 'Schedule dentist appointment',
         null::timestamptz,
         'medium', true,
         (now() - interval '1 day')::timestamptz,
         'Done — booked for Saturday'
) s
cross join auth.users u
where u.email = 'negm1565@gmail.com';

-- ============================================================
-- Debts (money owed to me)
-- ============================================================
insert into public.debts (user_id, person_name, amount, outstanding, due_date, note, status)
select u.id, s.person_name, s.amount, s.outstanding, s.due_date, s.note, s.status
from (
  select 'Sara Khaled' as person_name,
         750.00 as amount, 750.00 as outstanding,
         (now() + interval '2 days')::timestamptz as due_date,
         'October rent share' as note, 'pending' as status
  union all select 'Omar Tarek',
         1200.00, 400.00,
         (now() + interval '5 days')::timestamptz,
         'Car repair reimbursement', 'partial'
  union all select 'Layla Mostafa',
         320.00, 320.00,
         (now() - interval '1 day')::timestamptz,
         'Concert tickets', 'overdue'
  union all select 'Yousef Adel',
         580.00, 580.00,
         (now() + interval '9 days')::timestamptz,
         'Shared trip — Cairo', 'pending'
) s
cross join auth.users u
where u.email = 'negm1565@gmail.com';

-- ============================================================
-- Payments (history)
-- ============================================================
insert into public.payments (user_id, person_name, amount, received_at, method, note)
select u.id, s.person_name, s.amount, s.received_at, s.method, s.note
from (
  select 'Mariam Saad' as person_name, 250.00 as amount,
         (now() - interval '2 days')::timestamptz as received_at,
         'wallet' as method, 'Partial — restaurant split' as note
  union all select 'Omar Tarek', 800.00,
         (now() - interval '5 days')::timestamptz,
         'bank', 'Car repair — first installment'
  union all select 'Hana Youssef', 120.00,
         (now() - interval '9 days')::timestamptz,
         'cash', null
  union all select 'Karim Nabil', 430.00,
         (now() - interval '14 days')::timestamptz,
         'wallet', 'Shared groceries'
  union all select 'Sara Khaled', 600.00,
         (now() - interval '21 days')::timestamptz,
         'bank', 'September rent share'
) s
cross join auth.users u
where u.email = 'negm1565@gmail.com';

-- ============================================================
-- Calendar events
-- ============================================================
insert into public.calendar_events (user_id, title, start_time, end_time, type, location, note)
select u.id, s.title, s.start_time, s.end_time, s.type, s.location, s.note
from (
  select 'Morning shift — Clinic' as title,
         now()::timestamptz as start_time,
         (now() + interval '5 hours')::timestamptz as end_time,
         'shift' as type, 'Downtown' as location, null::text as note
  union all select 'Evening shift — Clinic',
         (now() + interval '2 days')::timestamptz,
         (now() + interval '2 days' + interval '6 hours')::timestamptz,
         'shift', 'Downtown', null
  union all select 'Night shift — Clinic',
         (now() + interval '4 days')::timestamptz,
         (now() + interval '5 days')::timestamptz,
         'shift', 'Downtown', null
  union all select 'Advanced Pharmacology',
         (now() + interval '1 day')::timestamptz,
         (now() + interval '1 day' + interval '2 hours')::timestamptz,
         'lecture', 'Hall B — Faculty of Medicine', null
  union all select 'Clinical Pathology',
         (now() + interval '3 days')::timestamptz,
         (now() + interval '3 days' + interval '2 hours')::timestamptz,
         'lecture', 'Hall C', null
  union all select 'Anatomy lab',
         (now() + interval '5 days')::timestamptz,
         (now() + interval '5 days' + interval '3 hours')::timestamptz,
         'lecture', 'Lab 4 — Dissection hall', null
  union all select 'Dentist — Dr. Mona',
         (now() + interval '6 days')::timestamptz,
         (now() + interval '6 days' + interval '30 minutes')::timestamptz,
         'appointment', 'Smile Clinic — Nasr City', null
  union all select 'Gym session',
         (now() + interval '1 day' + interval '9 hours')::timestamptz,
         (now() + interval '1 day' + interval '10 hours' + interval '30 minutes')::timestamptz,
         'personal', 'Gym Downtown', null
  union all select 'Family dinner',
         (now() + interval '2 days' + interval '11 hours')::timestamptz,
         (now() + interval '2 days' + interval '13 hours')::timestamptz,
         'personal', 'Home', null
  union all select 'Renew car registration',
         (now() + interval '7 days' + interval '2 hours')::timestamptz,
         (now() + interval '7 days' + interval '2 hours' + interval '15 minutes')::timestamptz,
         'reminder', null, 'Traffic office — Maadi'
) s
cross join auth.users u
where u.email = 'negm1565@gmail.com';

-- ============================================================
-- Incoming money
-- ============================================================
insert into public.incoming_money (user_id, source, amount, expected_date, status, note)
select u.id, s.source, s.amount, s.expected_date, s.status, s.note
from (
  select 'University stipend' as source, 1500.00 as amount,
         (now() + interval '3 days')::timestamptz as expected_date,
         'scheduled' as status, 'October disbursement' as note
  union all select 'Freelance — A. Hassan', 850.00,
         (now() + interval '6 days')::timestamptz,
         'scheduled', 'Design system delivery'
  union all select 'Family support', 400.00,
         (now() - interval '2 days')::timestamptz,
         'delayed', 'Awaiting transfer'
) s
cross join auth.users u
where u.email = 'negm1565@gmail.com';

-- ============================================================
-- Activity log
-- ============================================================
insert into public.activity_log (user_id, kind, description)
select u.id, s.kind, s.description
from (
  select 'payment' as kind,
         'Received $250 from Mariam Saad' as description
  union all select 'task',
         'Completed: Schedule dentist appointment'
  union all select 'debt',
         'New debt recorded — Yousef Adel, $580'
  union all select 'calendar',
         'Evening shift confirmed for Wednesday'
  union all select 'payment',
         'Received $800 from Omar Tarek'
  union all select 'system',
         'NEGM OS booted successfully'
) s
cross join auth.users u
where u.email = 'negm1565@gmail.com';

-- ============================================================
-- Verify — should show row counts per table
-- ============================================================
select 'tasks' as table_name, count(*) as rows from public.tasks t, auth.users u where t.user_id = u.id and u.email = 'negm1565@gmail.com'
union all select 'debts', count(*) from public.debts d, auth.users u where d.user_id = u.id and u.email = 'negm1565@gmail.com'
union all select 'payments', count(*) from public.payments p, auth.users u where p.user_id = u.id and u.email = 'negm1565@gmail.com'
union all select 'calendar_events', count(*) from public.calendar_events c, auth.users u where c.user_id = u.id and u.email = 'negm1565@gmail.com'
union all select 'incoming_money', count(*) from public.incoming_money i, auth.users u where i.user_id = u.id and u.email = 'negm1565@gmail.com'
union all select 'activity_log', count(*) from public.activity_log a, auth.users u where a.user_id = u.id and u.email = 'negm1565@gmail.com';
