import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, VALIDATION_RULES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Floating particles component for visual appeal
const FloatingParticle = ({ delay, duration, startX, startY }: { delay: number; duration: number; startX: number; startY: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animate();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(100)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1000,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(formSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Redirect authenticated users away from login screen
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to main app');
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL_PATTERN.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        console.log('Login successful, navigating to main app');
        // Navigate to main app after successful login
        router.replace('/(tabs)' as any);
      } else {
        setErrors({ general: result.error || 'Login failed. Please try again.' });
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Login failed. Please try again.' });
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isLoading) return;
    
    setIsGoogleLoading(true);
    setErrors({});
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        console.log('Google Sign-In successful, navigating to main app');
        router.replace('/(tabs)' as any);
      } else {
        setErrors({ general: result.error || 'Google Sign-In failed' });
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      setErrors({ general: error.message || 'Failed to sign in with Google' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Generate floating particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 200,
    duration: 3000 + Math.random() * 2000,
    startX: Math.random() * width,
    startY: Math.random() * height * 0.6,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#1a0533', '#2E073F', '#7209B7', '#A855F7']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Background Shapes */}
      <View style={styles.backgroundShapes}>
        <Animated.View 
          style={[
            styles.shape1, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: logoScale }] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.shape2, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: logoScale }] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.shape3, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: logoScale }] 
            }
          ]} 
        />
      </View>

      {/* Floating Particles */}
      {particles.map((particle, index) => (
        <FloatingParticle key={index} {...particle} />
      ))}

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header with Animated Logo */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    transform: [
                      { scale: logoScale },
                      { rotate: logoSpin },
                    ],
                  }
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.logoGradient}
                >
                  <View style={styles.logoInner}>
                    <Ionicons name="cut" size={45} color={COLORS.WHITE} />
                  </View>
                </LinearGradient>
              </Animated.View>
              
              <Animated.Text 
                style={[
                  styles.brandName,
                  { opacity: fadeAnim }
                ]}
              >
                CurlMap
              </Animated.Text>
              
              <Animated.Text 
                style={[
                  styles.title,
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >
                Welcome Back!
              </Animated.Text>
              
              <Animated.Text 
                style={[
                  styles.subtitle,
                  { opacity: fadeAnim }
                ]}
              >
                Sign in to discover amazing stylists near you
              </Animated.Text>
            </Animated.View>

            {/* Glassmorphism Form Container */}
            <Animated.View 
              style={[
                styles.formWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: formSlide }],
                }
              ]}
            >
              <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                <View style={styles.formContainer}>
                  {/* General Error */}
                  {errors.general && (
                    <Animated.View style={styles.errorContainer}>
                      <LinearGradient
                        colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
                        style={styles.errorGradient}
                      >
                        <Ionicons name="alert-circle" size={22} color={COLORS.ERROR} />
                        <Text style={styles.generalErrorText}>{errors.general}</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="mail" size={14} color={COLORS.PRIMARY} /> Email Address
                    </Text>
                    <View 
                      style={[
                        styles.inputWrapper, 
                        errors.email && styles.inputError,
                        focusedInput === 'email' && styles.inputFocused,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          focusedInput === 'email' 
                            ? ['rgba(114, 9, 183, 0.1)', 'rgba(168, 85, 247, 0.05)']
                            : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.95)']
                        }
                        style={styles.inputGradient}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={22}
                          color={
                            errors.email 
                              ? COLORS.ERROR 
                              : focusedInput === 'email' 
                                ? COLORS.PRIMARY 
                                : COLORS.GRAY_400
                          }
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your email"
                          placeholderTextColor={COLORS.GRAY_400}
                          value={formData.email}
                          onChangeText={(value) => handleInputChange('email', value)}
                          onFocus={() => setFocusedInput('email')}
                          onBlur={() => setFocusedInput(null)}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading}
                        />
                        {formData.email.length > 0 && !errors.email && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
                        )}
                      </LinearGradient>
                    </View>
                    {errors.email && (
                      <View style={styles.errorRow}>
                        <Ionicons name="warning" size={14} color={COLORS.ERROR} />
                        <Text style={styles.errorText}>{errors.email}</Text>
                      </View>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="lock-closed" size={14} color={COLORS.PRIMARY} /> Password
                    </Text>
                    <View 
                      style={[
                        styles.inputWrapper, 
                        errors.password && styles.inputError,
                        focusedInput === 'password' && styles.inputFocused,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          focusedInput === 'password' 
                            ? ['rgba(114, 9, 183, 0.1)', 'rgba(168, 85, 247, 0.05)']
                            : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.95)']
                        }
                        style={styles.inputGradient}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={22}
                          color={
                            errors.password 
                              ? COLORS.ERROR 
                              : focusedInput === 'password' 
                                ? COLORS.PRIMARY 
                                : COLORS.GRAY_400
                          }
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your password"
                          placeholderTextColor={COLORS.GRAY_400}
                          value={formData.password}
                          onChangeText={(value) => handleInputChange('password', value)}
                          onFocus={() => setFocusedInput('password')}
                          onBlur={() => setFocusedInput(null)}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                          disabled={isLoading}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={COLORS.GRAY_400}
                          />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                    {errors.password && (
                      <View style={styles.errorRow}>
                        <Ionicons name="warning" size={14} color={COLORS.ERROR} />
                        <Text style={styles.errorText}>{errors.password}</Text>
                      </View>
                    )}
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordContainer}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.PRIMARY} />
                  </TouchableOpacity>

                  {/* Login Button with Gradient */}
                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      onPress={handleLogin}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      disabled={isLoading}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={isLoading ? ['#999', '#777'] : [COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.loginButton}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={COLORS.WHITE} />
                        ) : (
                          <>
                            <Text style={styles.loginButtonText}>Sign In</Text>
                            <View style={styles.buttonArrow}>
                              <Ionicons name="arrow-forward" size={20} color={COLORS.WHITE} />
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <LinearGradient
                      colors={['transparent', COLORS.GRAY_300, 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dividerLine}
                    />
                    <View style={styles.dividerTextContainer}>
                      <Text style={styles.dividerText}>or continue with</Text>
                    </View>
                    <LinearGradient
                      colors={['transparent', COLORS.GRAY_300, 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dividerLine}
                    />
                  </View>

                  {/* Social Login Options */}
                  <View style={styles.socialContainer}>
                    <TouchableOpacity 
                      style={styles.socialButton} 
                      disabled={isLoading || isGoogleLoading}
                      onPress={handleGoogleSignIn}
                    >
                      <LinearGradient
                        colors={['#fff', '#f8f8f8']}
                        style={styles.socialGradient}
                      >
                        {isGoogleLoading ? (
                          <ActivityIndicator size="small" color="#DB4437" />
                        ) : (
                          <>
                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                            <Text style={styles.socialButtonText}>Google</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
                      <LinearGradient
                        colors={['#fff', '#f8f8f8']}
                        style={styles.socialGradient}
                      >
                        <Ionicons name="logo-apple" size={24} color="#000" />
                        <Text style={styles.socialButtonText}>Apple</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Stylist Login Link */}
                  <TouchableOpacity
                    style={styles.stylistLoginButton}
                    onPress={() => router.push('/auth/stylist-login')}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['rgba(114, 9, 183, 0.1)', 'rgba(168, 85, 247, 0.05)']}
                      style={styles.stylistGradient}
                    >
                      <View style={styles.stylistIconContainer}>
                        <Ionicons name="cut" size={20} color={COLORS.PRIMARY} />
                      </View>
                      <View style={styles.stylistTextContainer}>
                        <Text style={styles.stylistLoginTitle}>Are you a stylist?</Text>
                        <Text style={styles.stylistLoginSubtitle}>Tap here to login to your dashboard</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.PRIMARY} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View 
              style={[
                styles.signupContainer,
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={styles.signupLink}>Create Account</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <Text style={styles.footerText}>
                By signing in, you agree to our{' '}
                <Text style={styles.footerLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0533',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundShapes: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    top: -100,
    right: -100,
  },
  shape2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(114, 9, 183, 0.2)',
    bottom: 100,
    left: -80,
  },
  shape3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: '40%',
    right: -50,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.LG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 20,
    paddingBottom: SPACING.XL,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
    marginTop: SPACING.LG,
  },
  logoContainer: {
    marginBottom: SPACING.MD,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(114, 9, 183, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.WHITE,
    letterSpacing: 2,
    marginBottom: SPACING.SM,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: SPACING.XS,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  formWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.LG,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: SPACING.XL,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  errorContainer: {
    marginBottom: SPACING.LG,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },
  generalErrorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    marginLeft: SPACING.SM,
    flex: 1,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: SPACING.SM,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: SPACING.MD,
  },
  eyeIcon: {
    padding: SPACING.SM,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.XS,
    marginLeft: SPACING.SM,
  },
  errorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    marginLeft: SPACING.XS,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: SPACING.XL,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginRight: SPACING.XS,
  },
  loginButton: {
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.XL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    letterSpacing: 1,
  },
  buttonArrow: {
    marginLeft: SPACING.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: SPACING.MD,
  },
  dividerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.GRAY_500,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XL,
    gap: SPACING.MD,
  },
  socialButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  socialButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  stylistLoginButton: {
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  stylistGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
  },
  stylistIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(114, 9, 183, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  stylistTextContainer: {
    flex: 1,
  },
  stylistLoginTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  stylistLoginSubtitle: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  signupText: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signupLink: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  footerText: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});