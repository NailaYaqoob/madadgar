import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TYPE_CONFIG = {
  reasoning:        { color: theme.colors.primary, icon: 'brain' },
  state_transition: { color: theme.colors.success, icon: 'swap-horizontal' },
  tool_execution:   { color: theme.colors.warning, icon: 'cog-outline' },
  booking_lifecycle:{ color: theme.colors.secondary, icon: 'calendar-check' },
};

export const ReasoningTrace = ({ traceId, status, trace = [], booking }) => {
  const [expanded, setExpanded] = useState(false);

  if (!traceId) return null;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const statusColor = status === 'completed' ? theme.colors.success
    : status === 'requires_clarification' ? theme.colors.warning
    : theme.colors.error;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <TouchableOpacity onPress={toggleExpanded} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="xml" size={18} color={theme.colors.primary} style={styles.traceIcon} />
          <Text style={styles.title}>System Trace</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{status?.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Booking pill */}
      {booking && booking !== 'None' && (
        <View style={styles.bookingBar}>
          <MaterialCommunityIcons name="bookmark-check" size={14} color={theme.colors.success} style={{ marginRight: 6 }} />
          <Text style={styles.bookingLabel}>Booking ID: </Text>
          <Text style={styles.bookingId}>{booking}</Text>
        </View>
      )}

      {/* Trace steps */}
      {expanded && (
        <View style={styles.traceList}>
          <View style={styles.traceHeaderRow}>
            <Text style={styles.traceCountLabel}>{trace.length} operations executed</Text>
            <View style={styles.divider} />
          </View>
          {trace.map((entry, i) => (
            <TraceStep key={`${entry.agent}-${entry.type}-${i}`} entry={entry} index={i} />
          ))}
        </View>
      )}
    </View>
  );
};

const TraceStep = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const config = TYPE_CONFIG[entry.type] || { color: theme.colors.textMuted, icon: 'circle-outline' };

  const toggleOpen = () => {
    if (entry.metadata || entry.duration_ms) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen(!open);
    }
  };

  return (
    <TouchableOpacity
      onPress={toggleOpen}
      style={[styles.step, { borderLeftColor: config.color }]}
      activeOpacity={entry.metadata ? 0.7 : 1}
    >
      <View style={styles.stepHeader}>
        <View style={styles.stepHeaderLeft}>
          <MaterialCommunityIcons name={config.icon} size={14} color={config.color} style={{ marginRight: 6 }} />
          <Text style={[styles.stepAgent, { color: config.color }]}>{entry.agent}</Text>
          <Text style={styles.stepType}>{entry.type.replace('_', ' ')}</Text>
        </View>
        {entry.duration_ms !== undefined && (
          <Text style={styles.stepDuration}>{entry.duration_ms}ms</Text>
        )}
      </View>
      <Text style={styles.stepMessage}>{entry.message}</Text>
      {open && entry.metadata && (
        <View style={styles.metaWrapper}>
          <Text style={styles.stepMeta}>{JSON.stringify(entry.metadata, null, 2)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceDeep,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traceIcon: {
    marginRight: 8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginRight: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bookingBar,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bookingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  bookingId: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  traceList: {
    padding: 12,
    backgroundColor: theme.colors.surface,
  },
  traceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  traceCountLabel: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginRight: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  step: {
    backgroundColor: theme.colors.surfaceDeep,
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepAgent: {
    fontWeight: '700',
    fontSize: 12,
    marginRight: 8,
  },
  stepType: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  stepDuration: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
  stepMessage: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  metaWrapper: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  stepMeta: {
    color: theme.colors.primary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: theme.colors.background,
    padding: 8,
    borderRadius: 6,
  },
});
