import { Platform, StatusBar, Dimensions } from 'react-native';

export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    // For iOS, we'll rely on SafeAreaInsets
    return 0;
  }
  
  // For Android, get the status bar height
  return StatusBar.currentHeight || 24; // Default fallback
};

export const isIPhoneX = (): boolean => {
  const { height, width } = Dimensions.get('window');
  
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTV &&
    (height === 812 || width === 812 || height === 896 || width === 896 || height === 844 || width === 844)
  );
};

export const getHeaderHeight = (): number => {
  const statusBarHeight = getStatusBarHeight();
  const headerHeight = 56; // Standard header height
  
  return statusBarHeight + headerHeight;
};