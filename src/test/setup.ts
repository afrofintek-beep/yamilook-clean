// @ts-nocheck
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptTranslation from '@/i18n/locales/pt.json';

// Initialize i18next synchronously with Portuguese resources so components using
// useTranslation() render real strings (matching the app's default language)
// instead of raw translation keys during tests.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'pt',
    fallbackLng: 'pt',
    resources: {
      pt: { translation: ptTranslation },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (must be constructable for @floating-ui / Radix)
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver (must be constructable)
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// jsdom never fires image load events. Radix Avatar (and similar components)
// rely on an <img> load callback to decide whether to show the image or the
// fallback. Patch the `src` setter so assigning a truthy src synchronously
// dispatches a `load` event, letting AvatarImage render its <img>.
// Radix Avatar checks `image.complete && image.naturalWidth > 0` to decide the
// loaded state, so report a non-zero natural size for loaded images.
Object.defineProperty(window.HTMLImageElement.prototype, 'complete', {
  configurable: true,
  get() {
    return Boolean(this.getAttribute('src'));
  },
});
Object.defineProperty(window.HTMLImageElement.prototype, 'naturalWidth', {
  configurable: true,
  get() {
    return this.getAttribute('src') ? 100 : 0;
  },
});
Object.defineProperty(window.HTMLImageElement.prototype, 'naturalHeight', {
  configurable: true,
  get() {
    return this.getAttribute('src') ? 100 : 0;
  },
});

const originalImageSrc = Object.getOwnPropertyDescriptor(
  window.HTMLImageElement.prototype,
  'src'
);
Object.defineProperty(window.HTMLImageElement.prototype, 'src', {
  configurable: true,
  set(value: string) {
    if (originalImageSrc?.set) {
      originalImageSrc.set.call(this, value);
    } else {
      this.setAttribute('src', value);
    }
    if (value) {
      // Defer to a microtask so listeners attached after assignment still fire.
      queueMicrotask(() => {
        this.dispatchEvent(new Event('load'));
      });
    }
  },
  get() {
    if (originalImageSrc?.get) {
      return originalImageSrc.get.call(this);
    }
    return this.getAttribute('src') || '';
  },
});

// Pointer capture APIs used by Radix UI primitives (dropdowns, selects, etc.)
// jsdom does not implement these, so provide no-op polyfills.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn();
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
