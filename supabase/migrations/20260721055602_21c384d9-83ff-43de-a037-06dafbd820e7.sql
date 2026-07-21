
CREATE TYPE public.order_status AS ENUM ('reviewing', 'in_progress', 'completed');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded');
CREATE TYPE public.order_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.customer_tag AS ENUM ('new', 'loyal', 'vip');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_fa TEXT NOT NULL, name_en TEXT NOT NULL,
  price BIGINT NOT NULL DEFAULT 0, description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages read all" ON public.packages FOR SELECT USING (true);
CREATE POLICY "packages write auth" ON public.packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, name_fa TEXT, email TEXT UNIQUE,
  role TEXT, avatar_url TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees read all" ON public.employees FOR SELECT USING (true);
CREATE POLICY "employees write auth" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, name_fa TEXT, industry TEXT,
  email TEXT, phone TEXT,
  tag public.customer_tag NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  ltv BIGINT NOT NULL DEFAULT 0, notes TEXT,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_tag ON public.customers(tag);
GRANT SELECT ON public.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read all" ON public.customers FOR SELECT USING (true);
CREATE POLICY "customers write auth" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'reviewing',
  priority public.order_priority NOT NULL DEFAULT 'medium',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  amount BIGINT NOT NULL DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  deadline DATE, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
GRANT SELECT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders read all" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders write auth" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BEFORE trigger: force progress=100 when marking completed
CREATE OR REPLACE FUNCTION public.orders_before_status() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' THEN NEW.progress = 100; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_before_status BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_before_status();

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status,
  to_status public.order_status NOT NULL,
  note TEXT, changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_order ON public.order_status_history(order_id, changed_at DESC);
GRANT SELECT ON public.order_status_history TO anon;
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history read all" ON public.order_status_history FOR SELECT USING (true);
CREATE POLICY "history insert auth" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- AFTER trigger: log status transitions (row exists now)
CREATE OR REPLACE FUNCTION public.log_order_status_change() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history(order_id, from_status, to_status)
    VALUES (NEW.id, NULL, NEW.status);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_orders_status_log AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Seed
INSERT INTO public.packages (code, name_fa, name_en, price, description) VALUES
  ('bronze','پکیج برنزی','Bronze',3500000,'Entry level'),
  ('silver','پکیج نقره‌ای','Silver',6500000,'Mid tier'),
  ('gold','پکیج طلایی','Gold',12500000,'Premium'),
  ('custom','پکیج سفارشی','Custom',20000000,'Custom deliverables');

INSERT INTO public.employees (name, name_fa, email, role) VALUES
  ('Sara Nazari','سارا نظری','sara@aimotion.studio','Producer'),
  ('Ali Rezaei','علی رضایی','ali@aimotion.studio','AI Engineer'),
  ('Maryam K.','مریم کریمی','maryam@aimotion.studio','Motion Designer'),
  ('Reza F.','رضا فرهادی','reza@aimotion.studio','Editor');

INSERT INTO public.customers (name, name_fa, industry, email, phone, tag, score, ltv, last_activity_at) VALUES
  ('Arka Corp','شرکت آرکا','Tech','hi@arka.co','+98 21 8877 4421','vip',92,128000000,now()-interval '2 days'),
  ('Nova Brand','برند نوا','Retail','info@nova.io','+98 21 4432 9911','loyal',78,68500000,now()-interval '5 days'),
  ('Sepehr Group','گروه سپهر','Real Estate','office@sepehr.ir','+98 21 8811 2277','vip',88,245000000,now()),
  ('Delta Fitness','دلتا فیتنس','Fitness','hello@delta.fit','+98 21 3344 8890','new',62,12400000,now()-interval '7 days'),
  ('Kian Motors','کیان موتورز','Auto','sales@kian.auto','+98 21 2211 9988','vip',96,320000000,now()-interval '3 days'),
  ('Mahoor Resto','رستوران ماهور','F&B','book@mahoor.rest','+98 21 7788 1122','loyal',71,8600000,now()-interval '14 days'),
  ('Pars Studio','استودیو پارس','Media','contact@pars.studio','+98 21 5566 7788','new',58,4200000,now()-interval '1 day'),
  ('Zafar Tech','ظفر تک','Tech','it@zafar.tech','+98 21 9988 3322','loyal',74,18700000,now()-interval '4 days');

WITH c AS (SELECT id, name FROM public.customers),
     p AS (SELECT id, code FROM public.packages),
     e AS (SELECT id, name FROM public.employees)
INSERT INTO public.orders (order_code, customer_id, package_id, assignee_id, status, priority, progress, amount, payment_status, deadline)
VALUES
  ('AI-8421',(SELECT id FROM c WHERE name='Arka Corp'),(SELECT id FROM p WHERE code='gold'),(SELECT id FROM e WHERE name='Sara Nazari'),'in_progress','high',68,12800000,'paid',current_date+5),
  ('AI-8419',(SELECT id FROM c WHERE name='Nova Brand'),(SELECT id FROM p WHERE code='silver'),(SELECT id FROM e WHERE name='Ali Rezaei'),'completed','medium',100,6200000,'paid',current_date-2),
  ('AI-8417',(SELECT id FROM c WHERE name='Pars Studio'),(SELECT id FROM p WHERE code='custom'),(SELECT id FROM e WHERE name='Maryam K.'),'reviewing','high',20,24500000,'unpaid',current_date+10),
  ('AI-8415',(SELECT id FROM c WHERE name='Zafar Tech'),(SELECT id FROM p WHERE code='bronze'),(SELECT id FROM e WHERE name='Reza F.'),'in_progress','low',85,3800000,'paid',current_date+3),
  ('AI-8412',(SELECT id FROM c WHERE name='Sepehr Group'),(SELECT id FROM p WHERE code='gold'),(SELECT id FROM e WHERE name='Sara Nazari'),'in_progress','medium',45,15900000,'partial',current_date+7),
  ('AI-8410',(SELECT id FROM c WHERE name='Kian Motors'),(SELECT id FROM p WHERE code='custom'),(SELECT id FROM e WHERE name='Ali Rezaei'),'in_progress','high',32,32000000,'paid',current_date+12),
  ('AI-8408',(SELECT id FROM c WHERE name='Mahoor Resto'),(SELECT id FROM p WHERE code='bronze'),(SELECT id FROM e WHERE name='Reza F.'),'completed','low',100,3400000,'paid',current_date-6),
  ('AI-8405',(SELECT id FROM c WHERE name='Delta Fitness'),(SELECT id FROM p WHERE code='silver'),(SELECT id FROM e WHERE name='Maryam K.'),'reviewing','low',10,6500000,'unpaid',current_date+8),
  ('AI-8402',(SELECT id FROM c WHERE name='Arka Corp'),(SELECT id FROM p WHERE code='silver'),(SELECT id FROM e WHERE name='Ali Rezaei'),'completed','medium',100,6800000,'paid',current_date-12),
  ('AI-8400',(SELECT id FROM c WHERE name='Nova Brand'),(SELECT id FROM p WHERE code='bronze'),(SELECT id FROM e WHERE name='Reza F.'),'reviewing','medium',15,3200000,'unpaid',current_date+6);
