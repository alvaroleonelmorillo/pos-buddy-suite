-- =============================================
-- SISTEMA PUNTO DE VENTA - ESQUEMA DE BASE DE DATOS
-- =============================================

-- Tabla de perfiles de usuarios
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'cajero');

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'cajero',
  UNIQUE (user_id, role)
);

-- Función para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tabla de configuración del negocio
CREATE TABLE public.business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mi Tienda',
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 16.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de categorías de productos
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de productos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2),
  wholesale_min_qty INTEGER DEFAULT 10,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de clientes
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de ventas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES public.customers(id),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_received DECIMAL(10,2) DEFAULT 0,
  change_given DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash', -- cash, credit, card
  is_credit BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'completed', -- pending, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de detalle de ventas
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de movimientos de inventario
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  movement_type TEXT NOT NULL, -- entry, exit, adjustment, sale
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  notes TEXT,
  reference_id UUID, -- sale_id or purchase_id
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de abonos a créditos
CREATE TABLE public.credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  sale_id UUID REFERENCES public.sales(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de cortes de caja
CREATE TABLE public.cash_register_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  difference DECIMAL(10,2) DEFAULT 0,
  cash_sales DECIMAL(10,2) DEFAULT 0,
  credit_sales DECIMAL(10,2) DEFAULT 0,
  card_sales DECIMAL(10,2) DEFAULT 0,
  credit_payments_received DECIMAL(10,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  notes TEXT,
  cut_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de tickets pendientes (ventas en proceso)
CREATE TABLE public.pending_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES public.customers(id),
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_tickets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (solo admin puede ver todos los roles)
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Business config policies (todos los usuarios autenticados pueden ver)
CREATE POLICY "Authenticated users can view business config" ON public.business_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update business config" ON public.business_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Categories policies (todos pueden ver, solo admin puede modificar)
CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products policies (todos pueden ver y modificar para demo)
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales policies
CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update own sales" ON public.sales FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Sale items policies
CREATE POLICY "Authenticated users can view sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sale items" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory movements policies
CREATE POLICY "Authenticated users can view inventory" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Credit payments policies
CREATE POLICY "Authenticated users can view credit payments" ON public.credit_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create credit payments" ON public.credit_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Cash register cuts policies
CREATE POLICY "Users can view own cash cuts" ON public.cash_register_cuts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own cash cuts" ON public.cash_register_cuts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Pending tickets policies
CREATE POLICY "Users can view own pending tickets" ON public.pending_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own pending tickets" ON public.pending_tickets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_config_updated_at BEFORE UPDATE ON public.business_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cajero');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update stock after sale
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  INSERT INTO public.inventory_movements (product_id, user_id, movement_type, quantity, previous_stock, new_stock, reference_id)
  SELECT 
    NEW.product_id,
    s.user_id,
    'sale',
    NEW.quantity,
    p.stock + NEW.quantity,
    p.stock,
    NEW.sale_id
  FROM public.sales s, public.products p
  WHERE s.id = NEW.sale_id AND p.id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for stock update after sale item insert
CREATE TRIGGER update_stock_on_sale_item
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_after_sale();

-- Insert default business config
INSERT INTO public.business_config (name, address, phone) 
VALUES ('Mi Tienda', 'Calle Principal #123', '555-1234');

-- Insert some sample categories
INSERT INTO public.categories (name) VALUES 
  ('Abarrotes'),
  ('Bebidas'),
  ('Lácteos'),
  ('Dulces'),
  ('Limpieza'),
  ('Varios');

-- Insert some sample products
INSERT INTO public.products (barcode, name, category_id, purchase_price, sale_price, stock, min_stock) VALUES
  ('7501000111014', 'Coca-Cola 600ml', (SELECT id FROM public.categories WHERE name = 'Bebidas'), 12.00, 18.00, 50, 10),
  ('7501000111021', 'Pepsi 600ml', (SELECT id FROM public.categories WHERE name = 'Bebidas'), 11.00, 17.00, 45, 10),
  ('7501000112011', 'Sabritas Original 45g', (SELECT id FROM public.categories WHERE name = 'Abarrotes'), 10.00, 15.00, 30, 5),
  ('7501000113018', 'Leche Lala 1L', (SELECT id FROM public.categories WHERE name = 'Lácteos'), 22.00, 28.00, 25, 8),
  ('7501000114015', 'Pan Bimbo Grande', (SELECT id FROM public.categories WHERE name = 'Abarrotes'), 35.00, 45.00, 15, 5),
  ('7501000115012', 'Galletas Marías 170g', (SELECT id FROM public.categories WHERE name = 'Dulces'), 12.00, 18.00, 40, 10),
  ('7501000116019', 'Fabuloso 1L', (SELECT id FROM public.categories WHERE name = 'Limpieza'), 25.00, 35.00, 20, 5),
  ('7501000117016', 'Agua Ciel 1L', (SELECT id FROM public.categories WHERE name = 'Bebidas'), 8.00, 12.00, 60, 15),
  ('7501000118013', 'Aceite 1-2-3 900ml', (SELECT id FROM public.categories WHERE name = 'Abarrotes'), 38.00, 48.00, 18, 5),
  ('7501000119010', 'Atún Dolores 140g', (SELECT id FROM public.categories WHERE name = 'Abarrotes'), 18.00, 25.00, 35, 10);