import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Lock, Radio } from 'lucide-react';

/** Placeholder room page (Phase 2). Confirms create + access work; the actual
 *  voice+text room lands in Phase 3. RLS gates the fetch, so only the host and
 *  invited guests can load the conversa. */
export default function MokubicoConversa() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [conversa, setConversa] = useState<{ title: string | null; space: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('mokubico_conversas')
      .select('title, space')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setConversa(data); setState('ok'); }
        else setState('denied');
      });
  }, [id]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Esta conversa é privada. Não estás na lista de convidados.</p>
        <Button variant="ghost" onClick={() => navigate('/mokubico')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Radio className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-bold">{conversa?.title || 'Conversa'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tens acesso a esta conversa. A sala de <b>voz + texto</b> chega em breve.
        </p>
      </div>
      <Button variant="ghost" onClick={() => navigate(`/mokubico/${conversa?.space ?? ''}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao espaço
      </Button>
    </div>
  );
}
