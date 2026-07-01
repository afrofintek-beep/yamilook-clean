import { useEffect, useState } from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

function parseStoragePublicUrl(rawUrl: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(rawUrl);
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

function getFilenameFromUrl(rawUrl: string) {
  try {
    const u = new URL(rawUrl);
    return u.pathname.split('/').pop() || 'media';
  } catch {
    return rawUrl.split('/').pop() || 'media';
  }
}

function useResolvedMediaUrl(url: string) {
  const [resolvedUrl, setResolvedUrl] = useState(url);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setError(null);
      setResolvedUrl(url);

      const parsed = parseStoragePublicUrl(url);
      if (!parsed) return;

      const { data, error } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, 60 * 60 * 24 * 7);

      if (cancelled) return;

      if (error || !data?.signedUrl) {
        setError(error?.message || 'Unable to load media');
        setResolvedUrl(url);
        return;
      }

      setResolvedUrl(data.signedUrl);
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { resolvedUrl, error };
}

interface MediaPreviewProps {
  url: string;
  type: 'image' | 'video';
  open: boolean;
  onClose: () => void;
}

export function MediaPreview({ url, type, open, onClose }: MediaPreviewProps) {
  const { resolvedUrl, error } = useResolvedMediaUrl(url);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    setPlaybackError(false);
  }, [resolvedUrl, open]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.download = getFilenameFromUrl(url);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const showError = Boolean(error) || playbackError;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {type === 'image' ? (
            <img
              src={resolvedUrl}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onError={() => setPlaybackError(true)}
            />
          ) : (
            <video
              src={resolvedUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-w-full max-h-[90vh]"
              onError={() => setPlaybackError(true)}
            />
          )}

          {showError && (
            <div className="absolute bottom-4 left-4 right-4 text-center text-white/80 text-sm">
              This media couldn’t be played here. Try downloading it.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MediaThumbnailProps {
  url: string;
  type: 'image' | 'video';
  onClick?: () => void;
}

export function MediaThumbnail({ url, type, onClick }: MediaThumbnailProps) {
  const { resolvedUrl } = useResolvedMediaUrl(url);

  return (
    <button
      onClick={onClick}
      className="relative w-full max-w-[280px] rounded-xl overflow-hidden group"
      type="button"
    >
      {type === 'image' ? (
        <img src={resolvedUrl} alt="Media" className="w-full h-auto object-cover" />
      ) : (
        <div className="relative">
          <video
            src={resolvedUrl}
            className="w-full h-auto"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[16px] border-l-black border-y-[10px] border-y-transparent ml-1" />
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <ZoomIn className="w-6 h-6 text-white" />
      </div>
    </button>
  );
}

