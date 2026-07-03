import { useState, type ReactNode } from 'react';
import { ShieldCheck, ShieldAlert, Clock, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAfrolocCertification } from '../hooks/useAfrolocCertification';

/**
 * Gates monetization behind a certified AFROLOC address. Renders `children`
 * only when the user's address is certified; otherwise shows the current
 * certification state and (when applicable) a request-certification action.
 */
export function AfrolocCertificationGate({
  action,
  children,
}: {
  /** Short verb phrase for the copy, e.g. "te candidatares a criador". */
  action: string;
  children: ReactNode;
}) {
  const { status, isCertified, hasAddress, afrolocCode, requestCertification } =
    useAfrolocCertification();
  const [submitting, setSubmitting] = useState(false);

  if (isCertified) return <>{children}</>;

  const handleRequest = async () => {
    setSubmitting(true);
    const res = await requestCertification();
    setSubmitting(false);
    if (res.success) {
      toast.success('Pedido enviado. Uma autoridade vai validar o teu endereço AFROLOC.');
    } else if (res.error === 'no_address') {
      toast.error('Precisas primeiro de um endereço AFROLOC.');
    } else if (res.error === 'already_pending') {
      toast.message('Já tens um pedido de certificação pendente.');
    } else if (res.error === 'already_certified') {
      toast.message('O teu endereço já está certificado.');
    } else {
      toast.error('Não foi possível enviar o pedido. Tenta novamente.');
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-semibold">Endereço AFROLOC por certificar</span>
          {status === 'pending' && (
            <Badge variant="secondary" className="ml-auto text-xs gap-1">
              <Clock className="h-3 w-3" /> Em análise
            </Badge>
          )}
          {status === 'rejected' && (
            <Badge variant="destructive" className="ml-auto text-xs">Rejeitado</Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Para {action}, o teu endereço AFROLOC precisa de ser{' '}
          <span className="font-medium text-foreground">certificado por uma autoridade</span>.
        </p>

        {afrolocCode && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono truncate">{afrolocCode}</span>
          </div>
        )}

        {!hasAddress && (
          <p className="text-xs text-muted-foreground">
            Ainda não tens um endereço AFROLOC. Cria o teu endereço no perfil antes de pedir a
            certificação.
          </p>
        )}

        {status === 'pending' ? (
          <p className="text-xs text-muted-foreground">
            O teu pedido está a ser analisado por uma autoridade. Recebes o resultado em breve.
          </p>
        ) : (
          <Button className="w-full" disabled={!hasAddress || submitting} onClick={handleRequest}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {status === 'rejected' ? 'Pedir certificação de novo' : 'Pedir certificação'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
