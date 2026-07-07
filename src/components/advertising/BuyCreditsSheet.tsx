import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Coins, Loader2, Check } from 'lucide-react';

// Keep in sync with the PACKAGES map in the create-appypay-payment edge function.
const PACKAGES = [
  { id: 'start', credits: 1000, kwanza: 9000, label: 'Início' },
  { id: 'pro', credits: 5000, kwanza: 42000, label: 'Pro', popular: true },
  { id: 'max', credits: 12000, kwanza: 96000, label: 'Máximo' },
];

const kz = (n: number) => new Intl.NumberFormat('pt-AO').format(n) + ' Kz';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone?: () => void;
}

export function BuyCreditsSheet({ open, onOpenChange, onDone }: Props) {
  const [sel, setSel] = useState('pro');
  const [method, setMethod] = useState<'GPO' | 'REF'>('GPO');
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('create-appypay-payment', {
      body: { packageId: sel, method },
    });
    setLoading(false);
    if (error) {
      toast.error('Não foi possível iniciar o pagamento. Tenta novamente.');
      return;
    }
    if (data?.status === 'gateway_pending') {
      toast.info('Compra registada. O pagamento AppyPay ainda está a ser ativado.');
    } else {
      toast.success('Pagamento iniciado — segue as instruções no teu telemóvel.');
    }
    onDone?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Comprar créditos
          </SheetTitle>
        </SheetHeader>

        <div className="p-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            Os créditos servem para promover os teus posts e o teu negócio no feed. Escolhe um pacote.
          </p>

          <div className="space-y-2">
            {PACKAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSel(p.id)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  sel === p.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {p.credits.toLocaleString('pt-AO')} créditos
                      {p.popular && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums">{kz(p.kwanza)}</div>
                    {sel === p.id && <Check className="w-4 h-4 text-primary ml-auto mt-1" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Método de pagamento</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('GPO')}
                className={`rounded-lg border p-3 text-sm font-medium ${
                  method === 'GPO' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                Multicaixa Express
              </button>
              <button
                type="button"
                onClick={() => setMethod('REF')}
                className={`rounded-lg border p-3 text-sm font-medium ${
                  method === 'REF' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                Referência
              </button>
            </div>
          </div>

          <Button className="w-full h-12 rounded-xl" onClick={buy} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pagar com AppyPay'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Pagamento seguro via AppyPay · valores em AOA</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
