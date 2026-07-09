import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  /** Called after the gender is saved so the caller can refetch access. */
  onSaved: () => void;
}

/** Legacy accounts created before onboarding captured gender have no gender on
 *  file, so the Cozinha das Sis can't tell if they belong. Ask them to
 *  self-declare (never guess) — the same three options as onboarding. */
export function GenderPromptCard({ onSaved }: Props) {
  const { updateProfile } = useAuth();
  const [saving, setSaving] = useState<'male' | 'female' | 'other' | null>(null);

  const pick = async (gender: 'male' | 'female' | 'other') => {
    setSaving(gender);
    const { error } = await updateProfile({ gender });
    setSaving(null);
    if (error) {
      toast.error('Não foi possível guardar. Tenta de novo.');
      return;
    }
    onSaved();
  };

  const opts: { key: 'female' | 'male' | 'other'; emoji: string; label: string }[] = [
    { key: 'female', emoji: '👩🏾', label: 'Feminino' },
    { key: 'male', emoji: '👨🏾', label: 'Masculino' },
    { key: 'other', emoji: '✨', label: 'Prefiro não dizer' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 mt-2">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-foreground">A Cozinha das Sis é um espaço das mulheres 🍳</h2>
        <p className="text-xs text-muted-foreground">
          Para saber se este espaço é para ti, diz-nos quem és. Fica no teu perfil e podes mudar depois.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {opts.map((o) => (
          <Button
            key={o.key}
            variant="outline"
            className="h-14 rounded-xl justify-start text-base font-medium"
            disabled={saving !== null}
            onClick={() => pick(o.key)}
          >
            {saving === o.key ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <span className="text-2xl mr-3">{o.emoji}</span>
            )}
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
