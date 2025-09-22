import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, VALIDATION_RULES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL_PATTERN.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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

  const handleForgotPassword = async () => {
    if (!validateForm()) return;

    try {
      await forgotPassword(formData.email);
      setEmailSent(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to send reset email. Please try again.' });
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
          style={styles.background}
        >
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="mail-outline" size={80} color={COLORS.WHITE} />
            </View>
            
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailText}>{formData.email}</Text>
            </Text>
            
            <Text style={styles.instructionsText}>
              Click the link in your email to reset your password. 
              If you don't see the email, check your spam folder.
            </Text>
            
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setEmailSent(false);
                handleForgotPassword();
              }}
              disabled={isLoading}
            >
              <Text style={styles.resendButtonText}>Resend Email</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButtonIcon}
                onPress={handleBackToLogin}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Ionicons name="lock-closed-outline" size={40} color={COLORS.WHITE} />
                </View>
              </View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Don't worry, we'll send you reset instructions
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* General Error */}
              {errors.general && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.ERROR} />
                  <Text style={styles.errorText}>{errors.general}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={errors.email ? COLORS.ERROR : COLORS.GRAY_400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.GRAY_400}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    autoFocus
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Send Reset Button */}
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.sendButtonText}>Send Reset Email</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Remember your password? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity disabled={isLoading}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
  },
  backButtonIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: SPACING.SM,
  },
  logoContainer: {
    marginBottom: SPACING.LG,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    lineHeight: 22,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.ERROR}15`,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
  },
  inputContainer: {
    marginBottom: SPACING.XL,
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
  errorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
    marginLeft: SPACING.SM,
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  loginLink: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  successTitle: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.LG,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.LG,
    lineHeight: 26,
  },
  emailText: {
    fontWeight: 'bold',
  },
  instructionsText: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XXL,
  },
  backButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XXL,
    marginBottom: SPACING.LG,
    minWidth: 200,
  },
  backButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
  },
  resendButtonText: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});