import { useEffect, useState } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate framework initialization
    const timer = setTimeout(() => {
      setIsReady(true);
      window.frameworkReady?.();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isReady;
}
