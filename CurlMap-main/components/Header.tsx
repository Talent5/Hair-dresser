import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import { useDrawer } from '@/contexts/DrawerContext';
import { getStatusBarHeight } from '@/utils/statusBar';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  backgroundColor = COLORS.WHITE,
}) => {
  const { toggleDrawer } = useDrawer();
  const insets = useSafeAreaInsets();
  
  // Use safe area insets for iOS, manual calculation for Android
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : getStatusBarHeight();

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={backgroundColor} 
        translucent={false}
      />
      
      {/* Status bar spacer - only needed for Android when translucent */}
      {Platform.OS === 'android' && (
        <View style={{ height: statusBarHeight, backgroundColor }} />
      )}
      
      <View style={[styles.container, Platform.OS === 'ios' && { paddingTop: insets.top }]}>
        {/* Left Button */}
        <TouchableOpacity
          style={styles.leftButton}
          onPress={showBackButton ? onBackPress : toggleDrawer}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons
            name={showBackButton ? 'arrow-back' : 'menu'}
            size={24}
            color={COLORS.TEXT_PRIMARY}
          />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Component */}
        <View style={styles.rightContainer}>
          {rightComponent || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.WHITE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000, // Ensure header is above other elements
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    height: 56,
    minHeight: 56, // Ensure minimum touch target size
  },
  leftButton: {
    width: 44, // Increased for better touch target
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  rightContainer: {
    width: 44, // Increased for better touch target
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

export default Header;