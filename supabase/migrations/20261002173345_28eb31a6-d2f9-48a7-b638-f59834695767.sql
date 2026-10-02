CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_cpf text NOT NULL,
  customer_phone text NOT NULL,
  app_email text NOT NULL,
  selected_number text NOT NULL,
  chip_type text NOT NULL CHECK (chip_type IN ('esim','fisico')),
  plan text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  pix_code text,
  qr_code_url text,
  gateway_transaction_id text
);
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX orders_gateway_tx_idx ON public.orders (gateway_transaction_id);