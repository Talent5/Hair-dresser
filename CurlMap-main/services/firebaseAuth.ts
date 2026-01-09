import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Platform } from 'react-native';

// Web client ID from google-services.json
const WEB_CLIENT_ID = '382218411772-10l4vv9tjkvrpu7i80qik71p52g3e205.apps.googleusercontent.com';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface GoogleSignInResult {
  success: boolean;
  user?: FirebaseUser;
  idToken?: string;
  error?: string;
}

class FirebaseAuthService {
  private auth = auth();

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return this.auth.currentUser;
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return this.auth.onAuthStateChanged(callback);
  }

  /**
   * Sign in with Google using Firebase
   * Note: For React Native Firebase with Expo, you need to use expo-dev-client
   * and proper native module configuration
   */
  async signInWithGoogle(): Promise<GoogleSignInResult> {
    try {
      // For React Native Firebase Google Sign-In, we need @react-native-google-signin/google-signin
      // This is a placeholder that will work once the native module is configured
      
      // Import dynamically to avoid errors if not installed
      const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin');
      
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      
      // Get the ID token
      const idToken = signInResult.data?.idToken;
      
      if (!idToken) {
        throw new Error('No ID token returned from Google Sign-In');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with the Google credential
      const userCredential = await this.auth.signInWithCredential(googleCredential);

      const user = userCredential.user;
      
      // Get the Firebase ID token for backend authentication
      const firebaseIdToken = await user.getIdToken();

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
        },
        idToken: firebaseIdToken,
      };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === 12501) {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      if (error.code === 'IN_PROGRESS') {
        return { success: false, error: 'Sign-in is already in progress' };
      }
      if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return { success: false, error: 'Google Play Services is not available' };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to sign in with Google' 
      };
    }
  }

  /**
   * Sign in with email and password using Firebase
   */
  async signInWithEmailPassword(email: string, password: string): Promise<GoogleSignInResult> {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
        },
        idToken,
      };
    } catch (error: any) {
      console.error('Email Sign-In Error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Create a new account with email and password
   */
  async createAccount(email: string, password: string, displayName?: string): Promise<GoogleSignInResult> {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await user.updateProfile({ displayName });
      }

      // Send email verification
      await user.sendEmailVerification();

      const idToken = await user.getIdToken();

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName || user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
        },
        idToken,
      };
    } catch (error: any) {
      console.error('Create Account Error:', error);
      
      let errorMessage = 'Failed to create account';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      
      let errorMessage = 'Failed to send reset email';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Google if using Google Sign-In
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch (e) {
        // Google Sign-In might not be available, continue with Firebase sign out
      }
      
      await this.auth.signOut();
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  }

  /**
   * Get the current user's ID token for backend authentication
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Get ID Token Error:', error);
      return null;
    }
  }

  /**
   * Verify phone number (for 2FA or phone auth)
   */
  async verifyPhoneNumber(phoneNumber: string): Promise<string> {
    const confirmation = await this.auth.signInWithPhoneNumber(phoneNumber);
    return confirmation.verificationId;
  }

  /**
   * Link Google account to existing account
   */
  async linkGoogleAccount(): Promise<GoogleSignInResult> {
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      
      if (!idToken) {
        throw new Error('No ID token returned');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const user = this.auth.currentUser;
      
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      await user.linkWithCredential(googleCredential);
      const firebaseIdToken = await user.getIdToken();

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
        },
        idToken: firebaseIdToken,
      };
    } catch (error: any) {
      console.error('Link Google Account Error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
