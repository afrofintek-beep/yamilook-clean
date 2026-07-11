import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Lock, Mic, MicOff, Send, PhoneOff, Users, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMokubicoRoom } from '../hooks/useMokubicoRoom';
import { toast } from 'sonner';

interface ConversaInfo {
  title: string | null;
  space: string;
  host_id: string;
  livekit_room_name: string;
  status: string;
}

export default function MokubicoConversa() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [conversa, setConversa] = useState<ConversaInfo | null>(null);
  const [text, setText] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);

  const isHost = !!conversa && conversa.host_id === user?.id;
  const room = useMokubicoRoom(id ?? null, conversa?.livekit_room_name ?? null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('mokubico_conversas')
      .select('title, space, host_id, livekit_room_name, status')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setConversa(data); setState('ok'); }
        else setState('denied');
      });
  }, [id]);

  // Join the voice room once we have access to a live conversa.
  useEffect(() => {
    if (state === 'ok' && conversa?.status === 'live') room.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, conversa?.status]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [room.messages.length]);

  const send = () => { room.sendMessage(text); setText(''); };

  const endConversa = async () => {
    if (!id) return;
    await supabase.from('mokubico_conversas').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id);
    room.leave();
    toast.success('Conversa terminada.');
    navigate(`/mokubico/${conversa?.space ?? ''}`);
  };

  const leave = () => { room.leave(); navigate(`/mokubico/${conversa?.space ?? ''}`); };

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

  const ended = conversa?.status !== 'live';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border safe-top shrink-0">
        <button onClick={leave} className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{conversa?.title || 'Conversa'}</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {room.peers.length || 1} · {room.connected ? 'ao vivo' : room.connecting ? 'a entrar…' : ended ? 'terminada' : 'offline'}
          </p>
        </div>
        {isHost && !ended && (
          <Button size="sm" variant="destructive" className="rounded-full h-8" onClick={endConversa}>Terminar</Button>
        )}
      </header>

      {/* Participants (voice) */}
      <div className="px-4 py-4 shrink-0 border-b border-border/50">
        {room.error ? (
          <p className="text-xs text-destructive text-center">{room.error}</p>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {room.peers.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1.5 w-16">
                <div className={cn('rounded-full p-0.5 transition-colors', p.speaking ? 'ring-2 ring-green-500' : 'ring-2 ring-transparent')}>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[11px] text-muted-foreground truncate w-full text-center">
                  {p.id === room.selfId ? 'Tu' : p.name}
                </span>
              </div>
            ))}
            {room.connecting && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground self-center" />}
          </div>
        )}
      </div>

      {/* Text chat */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {room.messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Sê o primeiro a escrever.</p>
        ) : (
          room.messages.map((m) => {
            const mine = m.senderId === room.selfId;
            // Read when another member's cursor is at/after this message.
            const readByOther = mine && Object.entries(room.reads).some(
              ([uid, ts]) => uid !== room.selfId && ts >= m.createdAt,
            );
            return (
              <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-3 py-1.5 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                  {!mine && <div className="text-[10px] font-semibold opacity-70">{m.senderName}</div>}
                  {m.text}
                </div>
                {mine && (
                  <span className="mt-0.5 mr-1" title={readByOther ? 'Lida' : 'Enviada'}>
                    {readByOther
                      ? <CheckCheck className="w-3.5 h-3.5 text-primary" />
                      : <Check className="w-3.5 h-3.5 text-muted-foreground" />}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={msgEndRef} />
      </div>

      {/* Controls */}
      {ended ? (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground shrink-0">
          Esta conversa terminou.
        </div>
      ) : (
        <div className="p-3 border-t border-border flex items-center gap-2 shrink-0 safe-bottom">
          <Button
            size="icon"
            variant={room.micOn ? 'secondary' : 'destructive'}
            className="rounded-full h-11 w-11 shrink-0"
            onClick={room.toggleMic}
            disabled={!room.connected}
          >
            {room.micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Escreve uma mensagem…"
            className="h-11 rounded-full"
          />
          <Button size="icon" className="rounded-full h-11 w-11 shrink-0" onClick={send} disabled={!text.trim()}>
            <Send className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="destructive" className="rounded-full h-11 w-11 shrink-0" onClick={leave}>
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
