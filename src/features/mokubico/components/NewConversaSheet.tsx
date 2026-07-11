import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, X } from 'lucide-react';
import { MokubicoInviteSheet, type InvitedUser } from './MokubicoInviteSheet';
import { useOpenConversa } from '../hooks/useMokubicoConversas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  space: string;
  spaceTitle: string;
}

/** Open a free Mokubico conversa: a title and an individually-chosen guest list. */
export function NewConversaSheet({ open, onOpenChange, space, spaceTitle }: Props) {
  const navigate = useNavigate();
  const openConversa = useOpenConversa();
  const [title, setTitle] = useState('');
  const [guests, setGuests] = useState<InvitedUser[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const reset = () => { setTitle(''); setGuests([]); };

  const create = async () => {
    setCreating(true);
    try {
      const { id, existing } = await openConversa({ space, title: title.trim(), guestIds: guests.map((g) => g.id) });
      reset();
      onOpenChange(false);
      if (existing) toast.info('Já tens uma conversa aberta — leva-te a ela.');
      navigate(`/mokubico/conversa/${id}`);
    } catch {
      toast.error('Não foi possível abrir a conversa.');
    } finally {
      setCreating(false);
    }
  };

  const MAX_GUESTS = 7; // host + 7 = 8 people
  const onGuests = (chosen: InvitedUser[]) => {
    if (chosen.length > MAX_GUESTS) {
      toast.info(`Máximo ${MAX_GUESTS} convidados (8 pessoas na conversa).`);
      setGuests(chosen.slice(0, MAX_GUESTS));
    } else {
      setGuests(chosen);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Abrir conversa em {spaceTitle}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="conversa-title" className="text-sm">Sobre o quê?</Label>
            <Input
              id="conversa-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Papo de fim de tarde"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Quem entra</Label>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {guests.length === 0 ? 'Escolher pessoas' : `${guests.length} ${guests.length === 1 ? 'pessoa' : 'pessoas'}`}
                </div>
                <div className="text-xs text-muted-foreground">Só quem escolheres pode entrar</div>
              </div>
            </button>
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {guests.map((g) => (
                  <span key={g.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
                    {g.name}
                    <button onClick={() => setGuests((p) => p.filter((x) => x.id !== g.id))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button className="w-full h-12 rounded-xl" onClick={create} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Abrir conversa'}
          </Button>
        </div>

        <MokubicoInviteSheet open={inviteOpen} onOpenChange={setInviteOpen} selected={guests} onConfirm={onGuests} />
      </SheetContent>
    </Sheet>
  );
}
