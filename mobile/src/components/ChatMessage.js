import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const ChatMessage = ({ message, isUser, createdAt, status }) => {
  const isFailed = status === 'failed';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperSystem]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}

      <View style={[styles.column, isUser && styles.columnUser]}>
        <View style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.systemBubble,
          isFailed && styles.failedBubble,
        ]}>
          <Text style={[styles.text, isFailed && styles.failedText]}>{message}</Text>
        </View>

        {createdAt ? (
          <Text style={[styles.time, isUser && styles.timeUser]}>{createdAt}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
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
    borderWidth: 1,
    borderColor: theme.colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 16,
  },

  column: {
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  columnUser: {
    alignItems: 'flex-end',
  },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
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
  failedBubble: {
    backgroundColor: theme.colors.error + '18',
    borderColor: theme.colors.error + '55',
  },

  text: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  failedText: {
    color: theme.colors.error,
  },

  time: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginTop: 3,
    marginLeft: 4,
  },
  timeUser: {
    marginLeft: 0,
    marginRight: 4,
  },
});
