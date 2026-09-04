-- ==============================================================================
-- TokenWallet: Supabase Database Schema
-- ==============================================================================

-- 1. Table: Payment Schedules / Nhắc nhở thanh toán (tkw_payment_schedules)
CREATE TABLE IF NOT EXISTS public.tkw_payment_schedules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  account_email TEXT,
  due_date BIGINT NOT NULL,
  amount NUMERIC,
  currency TEXT DEFAULT 'VND',
  recurrence TEXT DEFAULT 'monthly',
  repeat_count INTEGER,
  completed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  payment_method TEXT,
  is_auto_debit BOOLEAN DEFAULT false,
  note TEXT,
  category TEXT,
  last_payment_date BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- In case table was created earlier without the new columns:
ALTER TABLE public.tkw_payment_schedules ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.tkw_payment_schedules ADD COLUMN IF NOT EXISTS is_auto_debit BOOLEAN DEFAULT false;

-- Enable RLS and create open policy for anon client
ALTER TABLE public.tkw_payment_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon on tkw_payment_schedules" ON public.tkw_payment_schedules;
CREATE POLICY "Allow all for anon on tkw_payment_schedules" 
ON public.tkw_payment_schedules 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Index for efficient querying by due date and status
CREATE INDEX IF NOT EXISTS idx_tkw_pay_due_status ON public.tkw_payment_schedules (status, due_date);