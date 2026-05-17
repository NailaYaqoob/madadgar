import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { sleep } from '../utils/sleep';

export const PhoneScreen = ({ onOtpSent }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <View style={styles.inner}>
        <View style={styles.logoBlock}>
          <Text style={styles.logoEmoji}>🤝</Text>
          <Text style={styles.logoTitle}>Madadgar</Text>
          <Text style={styles.logoSub}>AI Service Assistant for Pakistan</Text>
        </View>

        <Text style={styles.label}>Enter your mobile number</Text>

        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>🇵🇰  +92</Text>
          </View>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={t => {
              setError('');
              setPhone(t.replace(/\D/g, ''));
            }}
            placeholder="3001234567"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Send OTP"
          onPress={handleSend}
          loading={loading}
          disabled={phone.length < 10}
          style={styles.button}
        />

        <Text style={styles.hint}>A 6-digit code will be sent to your number</Text>
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
    paddingHorizontal: 28,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  prefixText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    letterSpacing: 2,
  },
  error: {
    color: theme.colors.error,
    fontSize: 13,
    marginTop: 8,
  },
  button: {
    marginTop: 24,
  },
  hint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
