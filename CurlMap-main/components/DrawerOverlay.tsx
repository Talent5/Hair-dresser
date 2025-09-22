import React from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useDrawer } from '@/contexts/DrawerContext';
import DrawerMenu from './DrawerMenu';
import { COLORS } from '@/constants';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const DrawerOverlay: React.FC = () => {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isDrawerOpen) {
      // Open drawer animation
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close drawer animation
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen, translateX, opacity]);

  return (
    <View 
      style={[
        StyleSheet.absoluteFill,
        { 
          zIndex: 1000,
          pointerEvents: isDrawerOpen ? 'auto' : 'none'
        }
      ]}
    >
      {/* Background overlay */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <DrawerMenu />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.WHITE,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default DrawerOverlay;