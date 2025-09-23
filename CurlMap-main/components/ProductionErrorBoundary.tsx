import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: any) => void;
  showRetry?: boolean;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorBoundaryKey: number;
}

class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorBoundaryKey: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Log the error for debugging
    console.error('Production Error Boundary caught error:', error);
    
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by ProductionErrorBoundary:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log specific error types for debugging
    if (error.message?.includes('Location') || error.message?.includes('permission')) {
      console.warn('Location/Permission error detected:', error.message);
    }
    
    if (error.message?.includes('Map') || error.message?.includes('react-native-maps')) {
      console.warn('Map-related error detected:', error.message);
    }

    if (error.message?.includes('TurboModule') || error.message?.includes('RCT')) {
      console.warn('Native module error detected:', error.message);
    }

    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      console.warn('Network error detected:', error.message);
    }
  }

  handleRetry = () => {
    // Reset the error boundary state and increment key to force remount
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined,
      errorBoundaryKey: prevState.errorBoundaryKey + 1
    }));

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    Alert.alert(
      'Error',
      'There was an issue with this feature. Please try again later or contact support if the problem persists.',
      [{ text: 'OK' }]
    );
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.props.fallbackMessage || 
        'Something went wrong. This might be due to a temporary issue with the app.';

      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={80} color={COLORS.ERROR} />
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>{errorMessage}</Text>
          
          <View style={styles.buttonContainer}>
            {this.props.showRetry !== false && (
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.homeButton} onPress={this.handleGoHome}>
              <Text style={styles.homeButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info (Dev Only):</Text>
              <Text style={styles.errorDetails} numberOfLines={5}>
                {this.state.error.message}
              </Text>
              {this.state.error.stack && (
                <Text style={styles.errorStack} numberOfLines={10}>
                  {this.state.error.stack}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }

    // Use key to force remount on retry
    return (
      <View key={this.state.errorBoundaryKey} style={{ flex: 1 }}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    lineHeight: 24,
    paddingHorizontal: SPACING.MD,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.MD,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    alignItems: 'center',
  },
  homeButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.MD,
  },
  debugContainer: {
    marginTop: SPACING.XL,
    padding: SPACING.MD,
    backgroundColor: COLORS.ERROR_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    width: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: SPACING.SM,
  },
  errorDetails: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.ERROR,
    fontFamily: 'monospace',
    marginBottom: SPACING.SM,
  },
  errorStack: {
    fontSize: 10,
    color: COLORS.ERROR,
    fontFamily: 'monospace',
  },
});

export default ProductionErrorBoundary;