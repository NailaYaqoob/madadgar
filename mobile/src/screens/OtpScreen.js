import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { sleep } from '../utils/sleep';

const OTP_LENGTH = 6;
const MOCK_OTP = '123456';

export const OtpScreen = ({ phone, onVerified, onBack }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    const t = setTimeout(() => inputs.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (digit && index === OTP_LENGTH - 1) {
      verify(next);
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = async (d = digits) => {
    const code = d.join('');
    if (code.length < OTP_LENGTH) {
      setError('Enter all 6 digits');
      return;
    }
    setLoading(true);
    await sleep(800);
    setLoading(false);

    if (code !== MOCK_OTP) {
      setError('Incorrect code. Try 123456 for this demo.');
      setDigits(Array(OTP_LENGTH).fill(''));
      const t = setTimeout(() => inputs.current[0]?.focus(), 50);
      return () => clearTimeout(t);
    }
    onVerified(phone);
  };

  const displayPhone = `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          <Text style={styles.backText}>Change number</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{' '}
            <Text style={styles.phone}>{displayPhone}</Text>
          </Text>

          <View style={styles.boxRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={r => { inputs.current[i] = r; }}
                style={[
                  styles.box,
                  d ? styles.boxFilled : null,
                  error ? styles.boxError : null,
                  focusedIndex === i && styles.boxFocused,
                ]}
                value={d}
                onChangeText={t => handleChange(t, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                onFocus={() => setFocusedIndex(i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Verify & Proceed"
            onPress={() => verify()}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity style={styles.resendBtn}>
            <Text style={styles.resendText}>Didn't receive a code? <Text style={styles.resendLink}>Resend</Text></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoHint}>
          <Text style={styles.demoText}>Demo code: 123456</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  phone: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  box: {
    width: 42,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceDeep,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  boxFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  boxFilled: {
    borderColor: theme.colors.primaryMuted,
  },
  boxError: {
    borderColor: theme.colors.error,
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
  resendBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  resendLink: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  demoHint: {
    marginTop: 32,
    alignItems: 'center',
  },
  demoText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
