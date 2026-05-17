import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../styles/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { sleep } from '../utils/sleep';

const OTP_LENGTH = 6;
const MOCK_OTP = '123456';

export const OtpScreen = ({ phone, onVerified, onBack }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Change number</Text>
        </TouchableOpacity>

        <View style={styles.headerBlock}>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Code sent to{' '}
            <Text style={styles.phone}>{displayPhone}</Text>
          </Text>
        </View>

        <View style={styles.boxRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { inputs.current[i] = r; }}
              style={[
                styles.box,
                d ? styles.boxFilled : null,
                error ? styles.boxError : null,
              ]}
              value={d}
              onChangeText={t => handleChange(t, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Verify"
          onPress={() => verify()}
          loading={loading}
          style={styles.button}
        />

        <Text style={styles.hint}>Demo code: 123456</Text>
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
  backButton: {
    position: 'absolute',
    top: 56,
    left: 28,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  headerBlock: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  phone: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceVariant,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  boxFilled: {
    borderColor: theme.colors.primary,
  },
  boxError: {
    borderColor: theme.colors.error,
  },
  error: {
    color: theme.colors.error,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  button: {
    marginTop: 28,
  },
  hint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
