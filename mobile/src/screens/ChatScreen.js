import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ChatMessage } from '../components/ChatMessage';
import { ReasoningTrace } from '../components/ReasoningTrace';
import { ChatService } from '../services/api';
import { theme } from '../styles/theme';

export const ChatScreen = ({ userId }) => {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I am your Madadgar AI Assistant. I can help you book plumbers, electricians, or AC technicians in Pakistan. What do you need today?', isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const msgCounter = useRef(1);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = { id: String(++msgCounter.current), text: inputText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await ChatService.sendRequest(userId, userMessage.text);

      const systemMessage = {
        id: String(++msgCounter.current),
        text: response.message,
        isUser: false,
        traceId: response.trace_id,
        status: response.status,
        trace: response.trace || [],
        booking: response.booking,
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage = {
        id: String(++msgCounter.current),
        text: "Sorry, I'm having trouble connecting to the backend. Please check if the server is running.",
        isUser: false,
        status: 'failed'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = useCallback(({ item }) => (
    <View>
      <ChatMessage message={item.text} isUser={item.isUser} />
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Madadgar AI Orchestrator</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Agents are reasoning...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="I need a plumber at G-13 tomorrow..."
          placeholderTextColor={theme.colors.textSecondary}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          submitBehavior="submit"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendButtonText}>Send</Text>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  messageList: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sendButtonText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
});
