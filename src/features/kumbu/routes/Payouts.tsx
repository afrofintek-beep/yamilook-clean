import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Banknote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovado', variant: 'default' },
  processed: { label: 'Processado', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
};

export default function Payouts() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const kumbuAvailable = profile?.kumbu_available ?? 0;

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Check eligibility: approved creator application
      const { data: app } = await supabase
        .from('creator_applications')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      setEligible(!!app);

      // Fetch payouts history
      const { data: pData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setPayouts(pData ?? []);
      setLoading(false);
    })();
  }, [user]);

  const handleSubmit = async () => {
    const kumbu = parseInt(amount, 10);
    if (!user || isNaN(kumbu) || kumbu <= 0) return;
    if (kumbu > kumbuAvailable) {
      toast.error('Saldo insuficiente.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('payout_requests').insert({
        user_id: user.id,
        amount_kumbu: kumbu,
        status: 'pending',
      });
      if (error) throw error;

      toast.success('Pedido de payout submetido.');
      setShowModal(false);
      setAmount('');

      // Refresh list
      const { data } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setPayouts(data ?? []);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao submeter pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">A carregar…</p>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 safe-top">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Payouts</h1>
        </header>
        <main className="max-w-lg mx-auto px-4 pt-8 text-center space-y-3">
          <Banknote className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            A funcionalidade de payouts está disponível apenas para criadores e mentores verificados.
          </p>
          <Button variant="secondary" onClick={() => navigate('/creator/apply')}>
            Candidatar-me como criador
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 safe-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Payouts</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          Novo pedido
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Kumbu disponível</p>
              <p className="text-2xl font-semibold">{kumbuAvailable}</p>
            </div>
            <p className="text-xs text-muted-foreground max-w-[160px] text-right leading-relaxed">
              Conversão mensal — sujeito a verificação.
            </p>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {payouts.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sem pedidos registados.
              </p>
            )}
            <ul className="divide-y">
              {payouts.map((p) => {
                const st = STATUS_MAP[p.status] ?? STATUS_MAP.pending;
                return (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.amount_kumbu} Kumbu</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(p.created_at), "d MMM yyyy", { locale: pt })}
                      </p>
                    </div>
                    <Badge variant={st.variant} className="text-xs shrink-0">
                      {st.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Request Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Novo pedido de payout</DialogTitle>
            <DialogDescription className="text-xs">
              Conversão mensal — sujeito a verificação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm">Quantidade (Kumbu)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                max={kumbuAvailable}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Máx. ${kumbuAvailable}`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={!amount || parseInt(amount) <= 0 || parseInt(amount) > kumbuAvailable || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Solicitar payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
