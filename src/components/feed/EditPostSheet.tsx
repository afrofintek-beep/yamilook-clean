import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin, Globe, Users, Circle, Lock } from 'lucide-react';
import { PostWithUser } from '@/hooks/usePosts';

interface EditPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostWithUser;
  onSave: (updates: { content?: string; location?: string; privacy?: string }) => Promise<void>;
}

// Privacy options are built inside the component using i18n

export function EditPostSheet({ open, onOpenChange, post, onSave }: EditPostSheetProps) {
  const { t } = useTranslation();
  const privacyOptions = [
    { value: 'everyone', icon: Globe, label: t('privacy.everyone', 'Wis') },
    { value: 'contacts', icon: Users, label: t('privacy.friends', 'Kambas') },
    { value: 'close_friends', icon: Circle, label: t('privacy.closeFriends', 'Bradas') },
    { value: 'only_me', icon: Lock, label: t('privacy.onlyMe', 'Só Eu') },
  ];
  const [content, setContent] = useState(post.content || '');
  const [location, setLocation] = useState(post.location || '');
  const [privacy, setPrivacy] = useState(post.privacy);
  const [saving, setSaving] = useState(false);

  // Reset state when the sheet opens or the post changes
  useEffect(() => {
    if (open) {
      setContent(post.content || '');
      setLocation(post.location || '');
      setPrivacy(post.privacy);
    }
  }, [open, post.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        content: content || undefined,
        location: location || undefined,
        privacy,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('feed.editPost', 'Editar publicação')}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('feed.whatsOnYourMind', 'No que estás a pensar?')}
            className="min-h-[120px] resize-none"
          />

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('feed.addLocation', 'Adicionar local')}
              className="flex-1"
            />
          </div>

          <Select value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {privacyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? t('common.saving', 'A guardar...') : t('common.save', 'Guardar')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
