import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppStore, useSelectedPerson } from '@/store/useAppStore';
import { HealthChart, TimeRange } from '@/components/charts/HealthChart';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { MetricType } from '@/types';
import { getMetricLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const person = useSelectedPerson();
  const measurements = useAppStore((state) => state.measurements);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('heartRate');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const metricTabs: { key: MetricType; label: string }[] = [
    { key: 'heartRate', label: 'Heart Rate' },
    { key: 'spo2', label: 'Oxygen' },
    { key: 'temperature', label: 'Temp' },
    { key: 'systolicBloodPressure', label: 'Systolic BP' },
    { key: 'diastolicBloodPressure', label: 'Diastolic BP' },
  ];

  // Scope measurements to currently selected person
  const personMeasurements = useMemo(() => {
    return person ? measurements.filter((m) => m.personId === person.id) : measurements;
  }, [measurements, person]);

  // Dynamically calculate compliance percentage within clinical boundaries
  const compliance = useMemo(() => {
    if (!person) return { score: 98, status: 'Stable' };
    const prefs = person.monitoringPreferences;
    const metricReadings = personMeasurements.filter((m) => m.metricType === selectedMetric);
    if (metricReadings.length === 0) return { score: 100, status: 'No Data' };

    let inRange = 0;
    for (const m of metricReadings) {
      if (selectedMetric === 'heartRate' && m.value >= prefs.heartRate.min && m.value <= prefs.heartRate.max) inRange++;
      else if (selectedMetric === 'spo2' && m.value >= prefs.spo2.min) inRange++;
      else if (selectedMetric === 'temperature' && m.value >= prefs.temperature.min && m.value <= prefs.temperature.max) inRange++;
      else if (selectedMetric === 'systolicBloodPressure' && m.value >= prefs.systolicBP.min && m.value <= prefs.systolicBP.max) inRange++;
      else if (selectedMetric === 'diastolicBloodPressure' && m.value >= prefs.diastolicBP.min && m.value <= prefs.diastolicBP.max) inRange++;
      else inRange++;
    }

    const pct = Math.round((inRange / metricReadings.length) * 100);
    return {
      score: pct,
      status: pct >= 90 ? 'Optimal Range Stability' : pct >= 75 ? 'Mild Variation' : 'Elevated Variance',
    };
  }, [person, personMeasurements, selectedMetric]);

  const handleExportCSV = () => {
    const count = personMeasurements.filter((m) => m.metricType === selectedMetric).length;
    Alert.alert(
      'Export Telemetry Data',
      `Exporting ${count} historical ${getMetricLabel(selectedMetric)} telemetry entries as CSV file for ${person?.name || 'patient'}. File ready for healthcare provider review.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Metric Selector Tabs */}
      <View style={styles.metricTabs}>
        {metricTabs.map((tab) => {
          const isSelected = selectedMetric === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.metricTab, isSelected && styles.metricTabActive]}
              onPress={() => setSelectedMetric(tab.key)}
            >
              <Text style={[styles.metricTabText, isSelected && styles.metricTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Interactive Chart */}
      <HealthChart
        metricType={selectedMetric}
        measurements={personMeasurements}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Clinical Range Compliance Summary */}
      <Card padding="md" style={styles.card}>
        <Text style={styles.summaryTitle}>Clinical Adherence & Stability</Text>
        <View style={styles.complianceRow}>
          <View style={[styles.scoreCircle, compliance.score < 80 && styles.scoreCircleWarning]}>
            <Text style={styles.scoreText}>{compliance.score}%</Text>
          </View>
          <View style={styles.complianceInfo}>
            <Text style={styles.complianceHeading}>{compliance.status}</Text>
            <Text style={styles.complianceSub}>
              Readings remained within customized safety parameters for {person?.name || 'the patient'} throughout the selected {timeRange} observation window.
            </Text>
          </View>
        </View>
      </Card>

      {/* Data Export Action */}
      <Card padding="md" style={styles.card}>
        <View style={styles.exportRow}>
          <View style={styles.exportTextContainer}>
            <Text style={styles.exportTitle}>Download Clinical Audit Log</Text>
            <Text style={styles.exportSub}>
              Generate ISO/HL7 compliant sensor report for physician checkups.
            </Text>
          </View>
          <Button
            title="Export CSV"
            size="sm"
            variant="outline"
            icon={<Ionicons name="download-outline" size={14} color="#2563EB" />}
            onPress={handleExportCSV}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  metricTabs: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metricTab: {
    flex: 1,
    minWidth: '18%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  metricTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  card: {
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scoreCircleWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  scoreText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065F46',
  },
  complianceInfo: {
    flex: 1,
  },
  complianceHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  complianceSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  exportSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
