import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { sleep } from '../utils/sleep';

export const PhoneScreen = ({ onOtpSent }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10-digit number after +92');
      return;
    }
    setError('');
    setLoading(true);
    await sleep(1000);
    setLoading(false);
    onOtpSent(`92${digits}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        <View style={styles.logoBlock}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="account-wrench" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.logoTitle}>Madadgar</Text>
          <Text style={styles.logoSub}>AI-Powered Service Assistant</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Welcome back</Text>
          <Text style={styles.subLabel}>Enter your phone number to continue</Text>

          <View style={[
            styles.inputRow,
            isFocused && styles.inputRowFocused,
            error ? styles.inputRowError : null
          ]}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+92</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={t => {
                setError('');
                setPhone(t.replace(/\D/g, ''));
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="300 1234567"
              placeholderTextColor={theme.colors.textDim}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Get Started"
            onPress={handleSend}
            loading={loading}
            disabled={phone.length < 10}
            style={styles.button}
          />

          <Text style={styles.hint}>
            We'll send a 6-digit code via SMS to verify your number.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  logoTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceDeep,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
  inputRowFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  inputRowError: {
    borderColor: theme.colors.error,
  },
  prefix: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  prefixText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  error: {
    color: theme.colors.error,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  button: {
    marginTop: 24,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
