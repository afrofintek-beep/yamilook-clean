import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CurrencyRate {
  id: string;
  currency_code: string;
  currency_name: string;
  country_name: string;
  country_code: string;
  symbol: string;
  rate_to_usd: number;
  rate_to_eur: number;
  credits_per_usd: number;
  is_active: boolean;
  display_order: number;
  updated_at?: string;
}

const STORAGE_KEY = 'preferred_currency';

export function useCurrencyRates() {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all active currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const rates = (data || []).map(rate => ({
        ...rate,
        rate_to_usd: Number(rate.rate_to_usd),
        rate_to_eur: Number(rate.rate_to_eur),
        credits_per_usd: Number(rate.credits_per_usd),
      }));
      
      setCurrencies(rates);

      // Load preferred currency from storage or default to USD
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = rates.find(c => c.currency_code === stored);
        if (found) {
          setSelectedCurrency(found);
        } else {
          setSelectedCurrency(rates.find(c => c.currency_code === 'USD') || rates[0] || null);
        }
      } else {
        setSelectedCurrency(rates.find(c => c.currency_code === 'USD') || rates[0] || null);
      }
    } catch (error) {
      console.error('Error fetching currency rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  // Change preferred currency
  const changeCurrency = useCallback((currencyCode: string) => {
    const currency = currencies.find(c => c.currency_code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      localStorage.setItem(STORAGE_KEY, currencyCode);
    }
  }, [currencies]);

  // Convert credits to selected currency
  const creditsToMoney = useCallback((credits: number): number => {
    if (!selectedCurrency) return 0;
    // credits / credits_per_usd = USD value
    // USD value / rate_to_usd = local currency value
    const usdValue = credits / selectedCurrency.credits_per_usd;
    return usdValue / selectedCurrency.rate_to_usd;
  }, [selectedCurrency]);

  // Convert money to credits
  const moneyToCredits = useCallback((amount: number): number => {
    if (!selectedCurrency) return 0;
    // amount * rate_to_usd = USD value
    // USD value * credits_per_usd = credits
    const usdValue = amount * selectedCurrency.rate_to_usd;
    return usdValue * selectedCurrency.credits_per_usd;
  }, [selectedCurrency]);

  // Format money with currency symbol
  const formatMoney = useCallback((credits: number, showDecimals: boolean = true): string => {
    if (!selectedCurrency) return `${credits} créditos`;
    const value = creditsToMoney(credits);
    const formatted = showDecimals ? value.toFixed(2) : Math.round(value).toString();
    return `${selectedCurrency.symbol}${formatted}`;
  }, [selectedCurrency, creditsToMoney]);

  // Format credits with equivalent money
  const formatCreditsWithMoney = useCallback((credits: number): string => {
    const money = formatMoney(credits);
    return `${credits} créditos (≈ ${money})`;
  }, [formatMoney]);

  // Get reference currencies (USD, EUR, GBP)
  const referenceCurrencies = currencies.filter(c => 
    ['USD', 'EUR', 'GBP'].includes(c.currency_code)
  );

  // Get local currencies (non-reference)
  const localCurrencies = currencies.filter(c => 
    !['USD', 'EUR', 'GBP'].includes(c.currency_code)
  );

  // Update rates from external API
  const updateRates = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('update-currency-rates');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Taxas atualizadas: ${data.message}`);
        await fetchCurrencies(); // Refresh local data
        return true;
      } else {
        throw new Error(data?.error || 'Falha ao atualizar taxas');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar taxas: ${message}`);
      console.error('Error updating currency rates:', error);
      return false;
    }
  }, [fetchCurrencies]);

  // Get last update time
  const getLastUpdate = useCallback((): Date | null => {
    if (currencies.length === 0) return null;
    const latest = currencies.reduce((max, curr) => {
      const currDate = curr.updated_at ? new Date(curr.updated_at) : new Date(0);
      return currDate > max ? currDate : max;
    }, new Date(0));
    return latest.getTime() > 0 ? latest : null;
  }, [currencies]);

  return {
    currencies,
    selectedCurrency,
    referenceCurrencies,
    localCurrencies,
    loading,
    changeCurrency,
    creditsToMoney,
    moneyToCredits,
    formatMoney,
    formatCreditsWithMoney,
    refetch: fetchCurrencies,
    updateRates,
    getLastUpdate
  };
}
