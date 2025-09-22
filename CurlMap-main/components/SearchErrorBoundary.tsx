import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Search screen error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log specific error types
    if (error.message?.includes('Location') || error.message?.includes('permission')) {
      console.warn('Location/Permission error detected');
    }
    
    if (error.message?.includes('Map') || error.message?.includes('maplibre')) {
      console.warn('Map-related error detected');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoBack = () => {
    // In a real app, you might want to navigate back
    Alert.alert(
      'Error',
      'There was an issue with the Find Stylists feature. Please try again later.',
      [{ text: 'OK' }]
    );
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.props.fallbackMessage || 
        'Something went wrong while loading the stylist search. This might be due to location permissions or map functionality.';

      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={80} color={COLORS.ERROR} />
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>{errorMessage}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={this.handleGoBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.errorDetails}>
                {this.state.error.message}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
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
  backButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.MD,
  },
  debugContainer: {
    marginTop: SPACING.XL,
    padding: SPACING.MD,
    backgroundColor: COLORS.ERROR_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    width: '100%',
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
  },
});

export default SearchErrorBoundary;