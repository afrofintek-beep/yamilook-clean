import { useState, useEffect, useRef, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  /** Show blur placeholder while loading */
  blur?: boolean;
  /** Priority loading (eager, no lazy) */
  priority?: boolean;
  /** Aspect ratio for placeholder (e.g., "1/1", "4/3", "16/9") */
  aspectRatio?: string;
  /** Container className */
  containerClassName?: string;
  /** Callback when loaded */
  onLoaded?: () => void;
}

// Simple in-memory cache for loaded images
const loadedImages = new Set<string>();

function preloadImage(src: string): Promise<void> {
  if (loadedImages.has(src)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let img: HTMLImageElement | null = null;

    try {
      if (typeof document !== 'undefined' && document.createElement) {
        img = document.createElement('img');
      } else if (typeof window !== 'undefined' && window.Image) {
        img = new window.Image();
      }
    } catch (e) {
      reject(e);
      return;
    }

    if (!img) {
      resolve();
      return;
    }

    img.onload = () => {
      loadedImages.add(src);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Preload multiple images (useful for feed prefetching)
export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    if (url && !loadedImages.has(url)) {
      preloadImage(url).catch(() => {});
    }
  });
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  blur = true,
  priority = false,
  aspectRatio,
  className,
  containerClassName,
  onLoaded,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(() => loadedImages.has(src));
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when src changes
  useEffect(() => {
    if (loadedImages.has(src)) {
      setIsLoaded(true);
      setHasError(false);
    } else {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src]);

  const handleLoad = () => {
    loadedImages.add(src);
    setIsLoaded(true);
    setHasError(false);
    onLoaded?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const showPlaceholder = blur && !isLoaded && !hasError;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatio && `aspect-[${aspectRatio}]`,
        containerClassName
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Shimmer placeholder */}
      {showPlaceholder && (
        <div className="absolute inset-0 shimmer-loading" />
      )}

      {/* Blur background */}
      {showPlaceholder && (
        <div
          className="absolute inset-0 scale-110 blur-xl opacity-50"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
          }}
        />
      )}

      {/*
        Always render the <img> and rely on the browser's native lazy loading.
        This works correctly with ANY scroll container (including Radix ScrollArea)
        unlike a JS IntersectionObserver which only detects window-level scroll.
      */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-xs">Imagem indisponível</span>
        </div>
      )}
    </div>
  );
});

export default OptimizedImage;
