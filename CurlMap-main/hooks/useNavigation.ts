import { router } from 'expo-router';

export const useNavigation = () => {
  const safeGoBack = (fallbackRoute?: string) => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Default fallback or use provided fallback
      const fallback = fallbackRoute || '/(tabs)';
      router.replace(fallback as any);
    }
  };

  return {
    safeGoBack,
    canGoBack: router.canGoBack,
    navigate: router.navigate,
    replace: router.replace,
    push: router.push,
  };
};