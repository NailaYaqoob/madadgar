import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const PrimaryButton = ({ label, onPress, loading = false, disabled = false, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.button, (disabled || loading) && styles.buttonDisabled, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading
          ? <ActivityIndicator size="small" color={theme.colors.background} />
          : <Text style={styles.label}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
    opacity: 0.6,
  },
  label: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
