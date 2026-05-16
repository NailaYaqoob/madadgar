import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const ChatMessage = ({ message, isUser }) => {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.systemContainer]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.xs,
  },
  userContainer: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.userBubble,
    borderBottomRightRadius: 0,
  },
  systemContainer: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.systemBubble,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
});
