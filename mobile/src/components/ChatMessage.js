import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const RobotIcon = ({ size, color }) => {
  if (Platform.OS === 'web') {
    return <Text style={{ fontSize: size - 2, lineHeight: size }}>🤖</Text>;
  }
  return <Ionicons name="robot-outline" size={size} color={color} />;
};

export const ChatMessage = ({ message, isUser, createdAt, status }) => {
  const isFailed = status === 'failed';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperSystem]}>
      {!isUser && (
        <View style={styles.avatar}>
          <RobotIcon size={18} color={theme.colors.primary} />
        </View>
      )}

      <View style={[styles.column, isUser && styles.columnUser]}>
        <View style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.systemBubble,
          isFailed && styles.failedBubble,
          isUser ? styles.userTail : styles.systemTail,
        ]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.systemText, isFailed && styles.failedText]}>
            {message}
          </Text>
        </View>

        {createdAt ? (
          <View style={[styles.timeContainer, isUser && styles.timeContainerUser]}>
            <Text style={styles.time}>{createdAt}</Text>
            {isUser && status === 'completed' && (
              <Ionicons name="checkmark-done" size={14} color={theme.colors.success} style={styles.checkIcon} />
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperSystem: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  column: {
    maxWidth: '82%',
    alignItems: 'flex-start',
  },
  columnUser: {
    alignItems: 'flex-end',
  },

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    ...theme.shadows.sm,
  },
  userBubble: {
    backgroundColor: theme.colors.userBubble,
    borderBottomRightRadius: 4,
  },
  systemBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userTail: {
    // Simulated tail via border radius
  },
  systemTail: {
    // Simulated tail via border radius
  },
  failedBubble: {
    backgroundColor: theme.colors.error + '15',
    borderColor: theme.colors.error + '40',
  },

  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  systemText: {
    color: theme.colors.textPrimary,
  },
  failedText: {
    color: theme.colors.error,
  },

  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 4,
  },
  timeContainerUser: {
    justifyContent: 'flex-end',
  },
  time: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  checkIcon: {
    marginLeft: 4,
  },
});
