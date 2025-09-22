import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, VALIDATION_RULES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function StylistLoginScreen() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Redirect authenticated stylists to appropriate screen
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Stylist authenticated, checking profile completion...');
      if (user.isStylist) {
        // Check if stylist has completed profile setup
        if (!user.specialties || user.specialties.length === 0) {
          router.replace('/stylist-setup');
        } else {
          router.replace('/stylist-dashboard');
        }
      } else {
        // Not a stylist, redirect to regular login
        Alert.alert(
          'Access Denied',
          'This login is for stylists only. Please use the customer login.',
          [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
        );
      }
    }
  }, [isAuthenticated, user, router]);

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

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await login(formData.email, formData.password);
      if (result.success && result.user) {
        console.log('Login successful, checking stylist role...');
        
        // Check if user is a stylist
        if (result.user.role !== 'stylist' && !result.user.isStylist) {
          setErrors({ 
            general: 'This login is for stylists only. Please use the customer login or register as a stylist.' 
          });
          return;
        }

        // Check if stylist profile is complete by looking at the user's isStylist flag and specialties
        // The convertUserToProfile function in AuthContext should have populated specialties from stylistProfile
        if (!result.user.isStylist || !result.user.specialties || result.user.specialties.length === 0) {
          console.log('Stylist profile incomplete, redirecting to setup...');
          router.replace('/stylist-setup');
        } else {
          console.log('Stylist profile complete, redirecting to stylist dashboard...');
          router.replace('/stylist-dashboard');
        }
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

  const handleBackToCustomerLogin = () => {
    router.replace('/auth/login');
  };

  const handleStylistSignup = () => {
    router.push('/auth/register?role=stylist');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToCustomerLogin}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
              <Text style={styles.backButtonText}>Customer Login</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Ionicons name="cut" size={40} color={COLORS.WHITE} />
                  <View style={styles.stylistBadge}>
                    <Ionicons name="star" size={16} color={COLORS.PRIMARY} />
                  </View>
                </View>
              </View>
              <Text style={styles.title}>Stylist Portal</Text>
              <Text style={styles.subtitle}>Sign in to manage your bookings and clients</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Stylist Features Info */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Stylist Features</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="calendar" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.featureText}>Manage bookings</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="chatbubbles" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.featureText}>Chat with clients</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="card" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.featureText}>Track earnings</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="wifi" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.featureText}>Offline support</Text>
                  </View>
                </View>
              </View>

              {/* General Error */}
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.ERROR} />
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Stylist Email</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={errors.email ? COLORS.ERROR : COLORS.GRAY_400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your stylist email"
                    placeholderTextColor={COLORS.GRAY_400}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={errors.password ? COLORS.ERROR : COLORS.GRAY_400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.GRAY_400}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
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
                      size={20}
                      color={COLORS.GRAY_400}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <>
                    <Ionicons name="log-in" size={20} color={COLORS.WHITE} style={styles.buttonIcon} />
                    <Text style={styles.loginButtonText}>Sign In as Stylist</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Stylist Sign Up */}
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleStylistSignup}
                disabled={isLoading}
              >
                <Ionicons name="person-add" size={20} color={COLORS.PRIMARY} style={styles.buttonIcon} />
                <Text style={styles.signupButtonText}>Become a Stylist</Text>
              </TouchableOpacity>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.SECONDARY} />
                <Text style={styles.infoText}>
                  New stylists will be guided through profile setup after registration
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.XXL,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: SPACING.XL,
    left: SPACING.XL,
    zIndex: 1,
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    marginLeft: SPACING.SM,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
    marginTop: SPACING.XXL,
  },
  logoContainer: {
    marginBottom: SPACING.LG,
    position: 'relative',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.XL,
    padding: SPACING.XL,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  featuresContainer: {
    backgroundColor: COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.SM,
  },
  featureText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.ERROR}15`,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
  },
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    paddingHorizontal: SPACING.MD,
  },
  inputError: {
    borderColor: COLORS.ERROR,
    backgroundColor: `${COLORS.ERROR}05`,
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
  errorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
    marginLeft: SPACING.SM,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.XL,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.XL,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  buttonIcon: {
    marginRight: SPACING.SM,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GRAY_200,
  },
  dividerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.GRAY_400,
    marginHorizontal: SPACING.MD,
  },
  signupButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    marginBottom: SPACING.LG,
  },
  signupButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.SECONDARY}15`,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.MD,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    fontStyle: 'italic',
  },
});