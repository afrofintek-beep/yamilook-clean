import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  /** Called when the user pulls past the threshold and releases. */
  onRefresh: () => Promise<void> | void;
  /** Returns the scrollable element to watch (e.g. a Radix ScrollArea viewport). */
  getScrollElement: () => HTMLElement | null;
  /** Pull distance (px) required to trigger a refresh. */
  threshold?: number;
  /** Max visual pull distance (px). */
  maxPull?: number;
}

/**
 * Touch-based pull-to-refresh. Attaches passive touch listeners to a scroll
 * element; when the user drags down while already at the top past `threshold`,
 * it runs `onRefresh`. Returns the live pull distance and refreshing state so
 * the caller can render an indicator.
 */
export function usePullToRefresh({
  onRefresh,
  getScrollElement,
  threshold = 70,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const startYRef = useRef<number | null>(null);
  const trackingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const getScrollElementRef = useRef(getScrollElement);
  onRefreshRef.current = onRefresh;
  getScrollElementRef.current = getScrollElement;

  const setPull = useCallback((v: number) => {
    pullRef.current = v;
    setPullDistance(v);
  }, []);

  useEffect(() => {
    const el = getScrollElementRef.current();
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (el.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        trackingRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!trackingRef.current || startYRef.current === null || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && el.scrollTop <= 0) {
        // Pulling down at the top — take over from native overscroll.
        e.preventDefault();
        setPull(Math.min(delta * 0.5, maxPull));
      } else if (delta <= 0) {
        // Reversed direction / scrolling down — cancel the gesture.
        trackingRef.current = false;
        setPull(0);
      }
    };

    const finish = () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      startYRef.current = null;
      if (pullRef.current >= threshold) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(threshold);
        Promise.resolve(onRefreshRef.current()).finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPull(0);
        });
      } else {
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', finish);
    el.addEventListener('touchcancel', finish);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', finish);
      el.removeEventListener('touchcancel', finish);
    };
  }, [threshold, maxPull, setPull]);

  return { pullDistance, refreshing, threshold };
}
