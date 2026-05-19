import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../components/ChatMessage';
import { ReasoningTrace } from '../components/ReasoningTrace';
import { ChatService } from '../services/api';
import { theme } from '../styles/theme';

const now = () =>
  new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

// ─── Animated typing dots ──────────────────────────────────────────────────
const TypingDots = React.memo(function TypingDots() {
  const anims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay((anims.length - 1 - i) * 160 + 240),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={dotStyles.row}>
      <View style={dotStyles.avatar}>
        <Ionicons name="robot-outline" size={16} color={theme.colors.primary} />
      </View>
      <View style={dotStyles.bubble}>
        {anims.map((a, i) => (
          <Animated.View
            key={i}
            style={[dotStyles.dot, {
              transform: [{
                translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
              }],
              opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            }]}
          />
        ))}
      </View>
    </View>
  );
});

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 3,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────
export const ChatScreen = ({ userId }) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I am your Madadgar AI Assistant. I can help you book plumbers, electricians, or AC technicians in Pakistan. What do you need today?',
      isUser: false,
      createdAt: now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const flatListRef = useRef(null);
  const msgCounter = useRef(1);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const history = messages.map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.text,
    }));

    const userMessage = {
      id: String(++msgCounter.current),
      text: inputText.trim(),
      isUser: true,
      createdAt: now(),
      status: 'completed',
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await ChatService.sendRequest(userId, userMessage.text, history);

      const systemMessage = {
        id: String(++msgCounter.current),
        text: response.message,
        isUser: false,
        createdAt: now(),
        traceId: response.trace_id,
        status: response.status,
        trace: response.trace || [],
        booking: response.booking,
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: String(++msgCounter.current),
        text: "Sorry, I'm having trouble connecting to the backend. Please check if the server is running.",
        isUser: false,
        createdAt: now(),
        status: 'failed',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = useCallback(({ item }) => (
    <View>
      <ChatMessage
        message={item.text}
        isUser={item.isUser}
        createdAt={item.createdAt}
        status={item.status}
      />
      {item.traceId && (
        <ReasoningTrace
          traceId={item.traceId}
          status={item.status}
          trace={item.trace}
          booking={item.booking}
        />
      )}
    </View>
  ), []);

  const canSend = inputText.trim().length > 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerAvatarWrap}>
          <View style={styles.headerAvatar}>
            <Ionicons name="robot" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Madadgar AI</Text>
          <Text style={styles.headerSubtitle}>Always here to help</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        style={styles.listContainer}
        contentContainerStyle={[styles.messageList, { paddingBottom: 20 }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        removeClippedSubviews={false}
      />

      {loading && <TypingDots />}

      {/* Input bar */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.inputBar, isFocused && styles.inputBarFocused]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="How can I help you today?"
            placeholderTextColor={theme.colors.textDim}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            style={[styles.sendBtn, canSend && styles.sendBtnActive]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Ionicons
              name="send"
              size={18}
              color={canSend ? '#FFFFFF' : theme.colors.textDim}
            />
          </TouchableOpacity>
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

  // ── Header ────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerAction: {
    padding: 8,
  },

  // ── Messages ──────────────────────────────────────────────────────────
  listContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
  },

  // ── Input bar ─────────────────────────────────────────────────────────
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: theme.colors.background,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  inputBarFocused: {
    borderColor: theme.colors.primaryMuted,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnActive: {
    backgroundColor: theme.colors.primaryMuted,
  },
});
