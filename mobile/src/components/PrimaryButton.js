import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const PrimaryButton = ({ label, onPress, loading = false, disabled = false, style }) => (
  <TouchableOpacity
    style={[styles.button, (disabled || loading) && styles.buttonDisabled, style]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    {loading
      ? <ActivityIndicator size="small" color={theme.colors.background} />
      : <Text style={styles.label}>{label}</Text>
    }
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  label: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
