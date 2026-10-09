import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VitalSignCard } from './VitalSignCard';
import { HealthMeasurement, Person } from '@/types';

export interface HealthMetricCardProps {
  person: Person;
  measurements: HealthMeasurement[];
  onSelectMetric?: (metricType: HealthMeasurement['metricType']) => void;
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  person,
  measurements,
  onSelectMetric,
}) => {
  const getLatest = (type: HealthMeasurement['metricType']) => {
    return measurements
      .filter((m) => m.metricType === type)
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];
  };

  const hr = getLatest('heartRate');
  const spo2 = getLatest('spo2');
  const temp = getLatest('temperature');
  const sysBP = getLatest('systolicBloodPressure');

  const prefs = person.monitoringPreferences;

  // Status evaluators
  const getHrStatus = (val?: number) => {
    if (val === undefined) return 'normal';
    if (val < prefs.heartRate.criticalMin || val > prefs.heartRate.criticalMax) return 'critical';
    if (val < prefs.heartRate.min || val > prefs.heartRate.max) return 'warning';
    return 'normal';
  };

  const getSpo2Status = (val?: number) => {
    if (val === undefined) return 'normal';
    if (val < prefs.spo2.criticalMin) return 'critical';
    if (val < prefs.spo2.min) return 'warning';
    return 'normal';
  };

  const getTempStatus = (val?: number) => {
    if (val === undefined) return 'normal';
    if (val < prefs.temperature.criticalMin || val > prefs.temperature.criticalMax) return 'critical';
    if (val < prefs.temperature.min || val > prefs.temperature.max) return 'warning';
    return 'normal';
  };

  const getSysBpStatus = (val?: number) => {
    if (val === undefined) return 'normal';
    if (val < prefs.systolicBP.criticalMin || val > prefs.systolicBP.criticalMax) return 'critical';
    if (val < prefs.systolicBP.min || val > prefs.systolicBP.max) return 'warning';
    return 'normal';
  };

  const isStale = (dateStr?: string) => {
    if (!dateStr) return true;
    const diffMin = (Date.now() - new Date(dateStr).getTime()) / 60000;
    return diffMin > prefs.measurementStaleMinutes;
  };

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <VitalSignCard
          metricType="heartRate"
          value={hr?.value ?? 72}
          measuredAt={hr?.measuredAt ?? new Date().toISOString()}
          isStale={isStale(hr?.measuredAt)}
          status={getHrStatus(hr?.value)}
          normalRangeText="60-100 BPM"
          onPress={() => onSelectMetric?.('heartRate')}
        />
        <View style={styles.gap} />
        <VitalSignCard
          metricType="spo2"
          value={spo2?.value ?? 98}
          measuredAt={spo2?.measuredAt ?? new Date().toISOString()}
          isStale={isStale(spo2?.measuredAt)}
          status={getSpo2Status(spo2?.value)}
          normalRangeText=">92%"
          onPress={() => onSelectMetric?.('spo2')}
        />
      </View>

      <View style={[styles.row, styles.marginTop]}>
        <VitalSignCard
          metricType="temperature"
          value={temp?.value ?? 36.8}
          measuredAt={temp?.measuredAt ?? new Date().toISOString()}
          isStale={isStale(temp?.measuredAt)}
          status={getTempStatus(temp?.value)}
          normalRangeText="36.0-37.5°C"
          onPress={() => onSelectMetric?.('temperature')}
        />
        <View style={styles.gap} />
        <VitalSignCard
          metricType="systolicBloodPressure"
          value={sysBP?.value ?? 120}
          measuredAt={sysBP?.measuredAt ?? new Date().toISOString()}
          isStale={isStale(sysBP?.measuredAt)}
          status={getSysBpStatus(sysBP?.value)}
          normalRangeText="90-140 mmHg"
          onPress={() => onSelectMetric?.('systolicBloodPressure')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gap: {
    width: 12,
  },
  marginTop: {
    marginTop: 12,
  },
});
