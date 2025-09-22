import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
  isReady: boolean;
}

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onFinish,
  isReady,
}) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const loadingDotsOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Loading dots animation
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Keep splash screen visible
    SplashScreen.preventAutoHideAsync();
    
    // Start animations immediately
    startAnimations();
  }, []);

  useEffect(() => {
    // When app is ready and animations are complete, hide splash
    if (isReady && animationComplete) {
      setTimeout(() => {
        SplashScreen.hideAsync();
        onFinish();
      }, 500);
    }
  }, [isReady, animationComplete]);

  const startAnimations = () => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Logo entrance animation
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Title animation
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtitle animation
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Loading dots animation
    Animated.sequence([
      Animated.delay(1600),
      Animated.timing(loadingDotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start loading dots sequence
      startLoadingDotsAnimation();
    });

    // Mark animations as complete after minimum duration
    setTimeout(() => {
      setAnimationComplete(true);
    }, 2500);
  };

  const startLoadingDotsAnimation = () => {
    const animateDots = () => {
      Animated.sequence([
        // Dot 1
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Dot 2
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Dot 3
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Reset all
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
      ]).start(() => {
        // Repeat if not ready yet
        if (!animationComplete || !isReady) {
          animateDots();
        }
      });
    };

    animateDots();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E073F" />
      
      <Animated.View 
        style={[
          styles.backgroundContainer,
          { opacity: backgroundOpacity }
        ]}
      >
        <LinearGradient
          colors={['#2E073F', '#7209B7', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        
        {/* Decorative circles */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
        <View style={[styles.decorativeCircle, styles.circle4]} />
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnimation) }
              ],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <View style={styles.logoInner}>
              {/* Hair curl icon */}
              <View style={styles.curlContainer}>
                <View style={[styles.curl, styles.curl1]} />
                <View style={[styles.curl, styles.curl2]} />
                <View style={[styles.curl, styles.curl3]} />
              </View>
              
              {/* Scissors accent */}
              <View style={styles.scissorsContainer}>
                <View style={styles.scissorsBlade1} />
                <View style={styles.scissorsBlade2} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* App title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>CurlMap</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <Text style={styles.subtitle}>Hair Stylist Platform</Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View
          style={[
            styles.loadingContainer,
            { opacity: loadingDotsOpacity },
          ]}
        >
          <Animated.View
            style={[
              styles.loadingDot,
              { opacity: dot1Opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { opacity: dot2Opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              { opacity: dot3Opacity },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E073F',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 80,
    height: 80,
    top: height * 0.1,
    left: width * 0.1,
  },
  circle2: {
    width: 60,
    height: 60,
    top: height * 0.15,
    right: width * 0.15,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: height * 0.25,
    left: width * 0.05,
  },
  circle4: {
    width: 70,
    height: 70,
    bottom: height * 0.2,
    right: width * 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  curlContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  curl: {
    position: 'absolute',
    borderRadius: 20,
  },
  curl1: {
    width: 50,
    height: 50,
    backgroundColor: '#7209B7',
    top: 5,
    left: 10,
    transform: [{ rotate: '15deg' }],
  },
  curl2: {
    width: 35,
    height: 35,
    backgroundColor: '#A855F7',
    top: 15,
    right: 5,
    transform: [{ rotate: '-20deg' }],
  },
  curl3: {
    width: 25,
    height: 25,
    backgroundColor: '#4ECDC4',
    bottom: 10,
    left: 20,
    transform: [{ rotate: '45deg' }],
  },
  scissorsContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  scissorsBlade1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginBottom: 2,
  },
  scissorsBlade2: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  titleContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleContainer: {
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '300',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
  },
});

export default AnimatedSplashScreen;