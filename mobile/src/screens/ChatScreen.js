import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
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
        <Text style={dotStyles.avatarEmoji}>🤖</Text>
      </View>
      <View style={dotStyles.bubble}>
        {anims.map((a, i) => (
          <Animated.View
            key={i}
            style={[dotStyles.dot, {
              transform: [{
                translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
              }],
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
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1, borderColor: theme.colors.primary + '44',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  avatarEmoji: { fontSize: 16 },
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
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 3,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────
export const ChatScreen = ({ userId }) => {
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
      text: inputText,
      isUser: true,
      createdAt: now(),
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatarWrap}>
          <Text style={styles.headerAvatarEmoji}>🤖</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Madadgar</Text>
          <Text style={styles.headerSubtitle}>AI Service Assistant · Pakistan</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        style={styles.listContainer}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        removeClippedSubviews={false}
      />

      {loading && <TypingDots />}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask for a plumber, electrician…"
          placeholderTextColor={theme.colors.textDim}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          submitBehavior="submit"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, canSend && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Text style={[styles.sendIcon, canSend && styles.sendIconActive]}>↑</Text>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatarEmoji: {
    fontSize: 36,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 11,
    height: 11,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },

  // ── Messages ──────────────────────────────────────────────────────────
  listContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
  },

  // ── Input bar ─────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.textPrimary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textDim,
  },
  sendIconActive: {
    color: theme.colors.background,
  },
});
