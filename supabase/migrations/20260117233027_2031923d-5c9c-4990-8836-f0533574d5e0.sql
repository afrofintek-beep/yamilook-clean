-- Create currency rates table for credit conversion
CREATE TABLE public.currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code TEXT NOT NULL UNIQUE,
  currency_name TEXT NOT NULL,
  country_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  symbol TEXT NOT NULL,
  rate_to_usd DECIMAL(18, 6) NOT NULL,
  rate_to_eur DECIMAL(18, 6) NOT NULL,
  credits_per_usd DECIMAL(10, 2) NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read currency rates
CREATE POLICY "Currency rates are publicly readable"
ON public.currency_rates
FOR SELECT
USING (true);

-- Only admins can modify currency rates (using has_role function)
CREATE POLICY "Admins can manage currency rates"
ON public.currency_rates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default currency rates for African countries and reference currencies
-- Base: 100 credits = 1 USD
INSERT INTO public.currency_rates (currency_code, currency_name, country_name, country_code, symbol, rate_to_usd, rate_to_eur, credits_per_usd, display_order) VALUES
-- Reference currencies
('USD', 'Dólar Americano', 'Estados Unidos', 'US', '$', 1.000000, 0.920000, 100, 1),
('EUR', 'Euro', 'União Europeia', 'EU', '€', 1.087000, 1.000000, 100, 2),
('GBP', 'Libra Esterlina', 'Reino Unido', 'GB', '£', 1.270000, 1.168000, 100, 3),

-- African currencies (PALOP + major African economies)
('AOA', 'Kwanza', 'Angola', 'AO', 'Kz', 0.001200, 0.001104, 100, 10),
('CVE', 'Escudo Cabo-verdiano', 'Cabo Verde', 'CV', '$', 0.009900, 0.009108, 100, 11),
('XOF', 'Franco CFA', 'Guiné-Bissau', 'GW', 'CFA', 0.001660, 0.001526, 100, 12),
('MZN', 'Metical', 'Moçambique', 'MZ', 'MT', 0.015600, 0.014352, 100, 13),
('STN', 'Dobra', 'São Tomé e Príncipe', 'ST', 'Db', 0.043500, 0.040020, 100, 14),
('BRL', 'Real Brasileiro', 'Brasil', 'BR', 'R$', 0.200000, 0.184000, 100, 15),
('ZAR', 'Rand Sul-africano', 'África do Sul', 'ZA', 'R', 0.055000, 0.050600, 100, 16),
('NGN', 'Naira', 'Nigéria', 'NG', '₦', 0.000650, 0.000598, 100, 17),
('KES', 'Xelim Queniano', 'Quénia', 'KE', 'KSh', 0.007800, 0.007176, 100, 18),
('GHS', 'Cedi', 'Gana', 'GH', 'GH₵', 0.080000, 0.073600, 100, 19),
('EGP', 'Libra Egípcia', 'Egito', 'EG', 'E£', 0.032000, 0.029440, 100, 20),
('MAD', 'Dirham', 'Marrocos', 'MA', 'DH', 0.100000, 0.092000, 100, 21),
('TZS', 'Xelim Tanzaniano', 'Tanzânia', 'TZ', 'TSh', 0.000390, 0.000359, 100, 22),
('UGX', 'Xelim Ugandês', 'Uganda', 'UG', 'USh', 0.000270, 0.000248, 100, 23),
('XAF', 'Franco CFA Central', 'Camarões', 'CM', 'FCFA', 0.001660, 0.001526, 100, 24),
('ETB', 'Birr Etíope', 'Etiópia', 'ET', 'Br', 0.018000, 0.016560, 100, 25),
('RWF', 'Franco Ruandês', 'Ruanda', 'RW', 'FRw', 0.000780, 0.000718, 100, 26);

-- Create trigger for updated_at
CREATE TRIGGER update_currency_rates_updated_at
BEFORE UPDATE ON public.currency_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();