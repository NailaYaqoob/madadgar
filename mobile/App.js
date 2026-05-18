import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PhoneScreen } from './src/screens/PhoneScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { ChatScreen } from './src/screens/ChatScreen';

const SESSION_KEY = 'madadgar_user_id';

export default function App() {
  const [stage, setStage] = useState('loading'); // loading | phone | otp | chat
  const [pendingPhone, setPendingPhone] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then(stored => {
      if (stored) {
        setUserId(stored);
        setStage('chat');
      } else {
        setStage('phone');
      }
    });
  }, []);

  const handleOtpSent = phone => {
    setPendingPhone(phone);
    setStage('otp');
  };

  const handleVerified = async phone => {
    await AsyncStorage.setItem(SESSION_KEY, phone);
    setUserId(phone);
    setStage('chat');
  };

  const handleBack = () => {
    setPendingPhone('');
    setStage('phone');
  };

  if (stage === 'loading') return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {stage === 'phone' && (
        <PhoneScreen onOtpSent={handleOtpSent} />
      )}
      {stage === 'otp' && (
        <OtpScreen
          phone={pendingPhone}
          onVerified={handleVerified}
          onBack={handleBack}
        />
      )}
      {stage === 'chat' && (
        <ChatScreen userId={userId} />
      )}
    </SafeAreaProvider>
  );
}
