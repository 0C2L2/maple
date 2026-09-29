import { useEffect, type RefObject } from 'react';
import { type View } from 'react-native';

// Web popovers: while `open`, Escape or a click outside `box` calls `close`. React Native Web views are DOM elements.
export function useDismiss(open: boolean, close: () => void, box: RefObject<View | null>) {
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (!(box.current as unknown as HTMLElement | null)?.contains(e.target as Node)) close();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, close, box]);
}
