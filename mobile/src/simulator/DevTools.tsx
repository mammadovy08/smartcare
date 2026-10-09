// Simulator DevTools
// Development-only UI for triggering scenarios

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { useSimulatorStore } from '@/store/useSimulatorStore';
import { useAppStore } from '@/store/useAppStore';
import { SCENARIOS, Scenario } from './scenarios';
import { getSeverityColor, getSeverityLabel } from '@/utils/format';

export const DevTools: React.FC = () => {
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const { isRunning, currentScenario, lastResult, history, runScenario, runAllScenarios, stop, clearHistory } = useSimulatorStore();

  const handleRunScenario = async (scenario: Scenario) => {
    try {
      await runScenario(scenario.id);
    } catch (error) {
      Alert.alert('Error', `Failed to run scenario: ${error}`);
    }
  };

  const handleRunAll = async () => {
    if (isRunning) return;
    try {
      await runAllScenarios();
    } catch (error) {
      Alert.alert('Error', `Failed to run all scenarios: ${error}`);
    }
  };

  if (!__DEV__ && !isDemoMode) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🔬 Simulator DevTools</Text>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusValue, { color: isRunning ? '#F59E0B' : '#16A34A' }]}>
          {isRunning ? `Running: ${currentScenario}` : 'Idle'}
        </Text>
      </View>

      {lastResult && (
        <View style={styles.lastResult}>
          <Text style={styles.lastResultLabel}>Last Result:</Text>
          <View style={styles.lastResultBadges}>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(lastResult.severity as any) }]}>
              <Text style={styles.severityBadgeText}>{getSeverityLabel(lastResult.severity as any)}</Text>
            </View>
            <Text style={styles.ruleText}>Rule: {lastResult.ruleTriggered}</Text>
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>Scenarios</Text>
      <ScrollView style={styles.scenarioList} contentContainerStyle={styles.scenarioListContent}>
        {SCENARIOS.map(scenario => (
          <TouchableOpacity
            key={scenario.id}
            style={[styles.scenarioButton, { borderLeftColor: getSeverityColor(scenario.severity) }]}
            onPress={() => handleRunScenario(scenario)}
            disabled={isRunning}
            activeOpacity={0.7}
          >
            <View style={styles.scenarioInfo}>
              <Text style={styles.scenarioName}>{scenario.name}</Text>
              <Text style={styles.scenarioDesc}>{scenario.description}</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(scenario.severity) }]}>
                <Text style={styles.severityBadgeText}>{getSeverityLabel(scenario.severity)}</Text>
              </View>
            </View>
            <Text style={styles.ruleId}>{scenario.ruleTriggered}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.runAllButton, isRunning && styles.disabled]}
          onPress={handleRunAll}
          disabled={isRunning}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>{isRunning ? 'Running...' : 'Run All Scenarios'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.stopButton, !isRunning && styles.disabled]}
          onPress={stop}
          disabled={!isRunning}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Clear History?', 'This will clear the scenario history.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', onPress: clearHistory, style: 'destructive' },
          ])}
        >
          <Text style={styles.actionButtonText}>Clear History</Text>
        </TouchableOpacity>
      </View>

      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionHeader}>History ({history.length})</Text>
          <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
            {history.slice(0, 20).map((entry, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyTime}>{new Date(entry.timestamp).toLocaleTimeString()}</Text>
                <Text style={styles.historyScenario}>{entry.scenario}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(entry.severity) }]}>
                  <Text style={styles.severityBadgeText}>{getSeverityLabel(entry.severity)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastResult: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  lastResultLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  lastResultBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ruleText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  scenarioList: {
    maxHeight: 300,
  },
  scenarioListContent: {
    gap: 8,
  },
  scenarioButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scenarioInfo: {
    flex: 1,
    marginRight: 12,
  },
  scenarioName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  ruleId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  runAllButton: {
    backgroundColor: '#2563EB',
  },
  stopButton: {
    backgroundColor: '#DC2626',
  },
  disabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historySection: {
    marginTop: 16,
  },
  historyList: {
    maxHeight: 150,
  },
  historyListContent: {
    gap: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  historyTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    width: 70,
  },
  historyScenario: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    marginHorizontal: 8,
  },
});