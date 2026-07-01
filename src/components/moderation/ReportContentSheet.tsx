import { useState } from 'react';
import { Flag, AlertTriangle, MessageSquareWarning, UserX, Skull, Ban, HelpCircle, Bot, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useModeration } from '@/hooks/useModeration';

interface ReportContentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'post' | 'comment' | 'user' | 'ritmo' | 'status';
  targetId: string;
}

const REPORT_CATEGORIES = [
  { value: 'spam', label: 'Spam', icon: Bot, description: 'Conteúdo repetitivo ou comercial indesejado' },
  { value: 'harassment', label: 'Assédio', icon: MessageSquareWarning, description: 'Intimidação ou bullying' },
  { value: 'hate_speech', label: 'Discurso de ódio', icon: Skull, description: 'Discriminação ou incitação ao ódio' },
  { value: 'nudity', label: 'Nudez', icon: Ban, description: 'Conteúdo sexual ou nudez' },
  { value: 'violence', label: 'Violência', icon: AlertTriangle, description: 'Conteúdo violento ou perturbador' },
  { value: 'misinformation', label: 'Desinformação', icon: HelpCircle, description: 'Informação falsa ou enganosa' },
  { value: 'impersonation', label: 'Personificação', icon: UserX, description: 'Fingir ser outra pessoa' },
  { value: 'other', label: 'Outro', icon: Flag, description: 'Outro motivo não listado' },
] as const;

export function ReportContentSheet({ open, onOpenChange, targetType, targetId }: ReportContentSheetProps) {
  const { submitReport } = useModeration();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'category' | 'details'>('category');

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await submitReport(targetType, targetId, selectedCategory, description || undefined);
      onOpenChange(false);
      // Reset state
      setSelectedCategory(null);
      setDescription('');
      setStep('category');
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStep('details');
  };

  return (
    <Sheet open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) {
        setSelectedCategory(null);
        setDescription('');
        setStep('category');
      }
    }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Denunciar {targetType === 'post' ? 'publicação' : targetType === 'comment' ? 'comentário' : targetType === 'user' ? 'utilizador' : 'conteúdo'}
          </SheetTitle>
          <SheetDescription>
            {step === 'category'
              ? 'Seleciona o motivo da denúncia'
              : 'Adiciona mais detalhes (opcional)'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {step === 'category' ? (
            REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border border-border',
                  'hover:bg-muted/50 transition-colors text-left',
                  selectedCategory === cat.value && 'border-primary bg-primary/5'
                )}
              >
                <cat.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </button>
            ))
          ) : (
            <>
              <div className="bg-muted/50 rounded-xl p-3 mb-4">
                <p className="text-sm font-medium">
                  Categoria: {REPORT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </p>
              </div>
              <Textarea
                placeholder="Descreve o problema com mais detalhe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('category')}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enviar denúncia
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
