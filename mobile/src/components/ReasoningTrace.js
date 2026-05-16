import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

const TYPE_COLOR = {
  reasoning:        '#00E5FF',
  state_transition: '#00E676',
  tool_execution:   '#FFD740',
  booking_lifecycle:'#B388FF',
};

const TYPE_ICON = {
  reasoning:        '🧠',
  state_transition: '🔄',
  tool_execution:   '⚙️',
  booking_lifecycle:'📋',
};

export const ReasoningTrace = ({ traceId, status, trace = [], booking }) => {
  const [expanded, setExpanded] = useState(false);

  if (!traceId) return null;

  const statusColor = status === 'completed' ? theme.colors.success
    : status === 'requires_clarification' ? '#FFD740'
    : theme.colors.error;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded(v => !v)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🤖 Antigravity Agent Trace</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{status?.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Booking pill */}
      {booking && booking !== 'None' && (
        <View style={styles.bookingBar}>
          <Text style={styles.bookingLabel}>📌 Booking ID: </Text>
          <Text style={styles.bookingId}>{booking}</Text>
        </View>
      )}

      {/* Trace steps */}
      {expanded && (
        <View style={styles.traceList}>
          <Text style={styles.traceCountLabel}>{trace.length} reasoning steps</Text>
          {trace.map((entry, i) => (
            <TraceStep key={i} entry={entry} index={i} />
          ))}
        </View>
      )}
    </View>
  );
};

const TraceStep = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const color = TYPE_COLOR[entry.type] || '#A0A0A0';
  const icon  = TYPE_ICON[entry.type]  || '•';

  return (
    <TouchableOpacity
      onPress={() => entry.metadata || entry.duration_ms ? setOpen(v => !v) : null}
      style={[styles.step, { borderLeftColor: color }]}
      activeOpacity={entry.metadata ? 0.7 : 1}
    >
      <View style={styles.stepHeader}>
        <Text style={[styles.stepAgent, { color }]}>{icon} {entry.agent}</Text>
        <Text style={styles.stepType}>{entry.type}</Text>
        {entry.duration_ms !== undefined && (
          <Text style={styles.stepDuration}>{entry.duration_ms}ms</Text>
        )}
      </View>
      <Text style={styles.stepMessage}>{entry.message}</Text>
      {open && entry.metadata && (
        <Text style={styles.stepMeta}>{JSON.stringify(entry.metadata, null, 2)}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: '#1A1A2E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  title: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
  chevron: {
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2137',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bookingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  bookingId: {
    color: theme.colors.success,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  traceList: {
    padding: theme.spacing.sm,
  },
  traceCountLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginBottom: 6,
    textAlign: 'right',
  },
  step: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 6,
    borderLeftWidth: 3,
    padding: 8,
    marginBottom: 5,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
    gap: 6,
  },
  stepAgent: {
    fontWeight: '700',
    fontSize: 11,
  },
  stepType: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    textTransform: 'uppercase',
    backgroundColor: '#3D3D3D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stepDuration: {
    color: '#777',
    fontSize: 9,
    marginLeft: 'auto',
  },
  stepMessage: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
  },
  stepMeta: {
    marginTop: 5,
    color: '#AAA',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#1A1A1A',
    padding: 6,
    borderRadius: 4,
  },
});
