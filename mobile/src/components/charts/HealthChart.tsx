import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { HealthMeasurement, MetricType } from '@/types';
import { getMetricLabel, getMetricUnit } from '@/utils/format';
import { CHART_COLORS } from '@/utils/constants';

export type TimeRange = '24h' | '7d' | '30d';

export interface HealthChartProps {
  metricType: MetricType;
  measurements: HealthMeasurement[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  title?: string;
  testID?: string;
}

export const HealthChart: React.FC<HealthChartProps> = ({
  metricType,
  measurements,
  timeRange,
  onTimeRangeChange,
  title,
  testID,
}) => {
  const chartColor =
    CHART_COLORS[metricType as keyof typeof CHART_COLORS] || '#2563EB';

  // Filter measurements by metricType and time range
  const filteredData = useMemo(() => {
    const now = Date.now();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const cutoff = now - hours * 3600 * 1000;

    return measurements
      .filter(
        (m) =>
          m.metricType === metricType &&
          new Date(m.measuredAt).getTime() >= cutoff
      )
      .sort(
        (a, b) =>
          new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
      );
  }, [measurements, metricType, timeRange]);

  // Compute stats
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const values = filteredData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / values.length) * 10) / 10;
    const latest = values[values.length - 1];

    return { min, max, avg, latest };
  }, [filteredData]);

  const unit = getMetricUnit(metricType);

  return (
    <Card testID={testID} padding="md" style={styles.card}>
      {/* Header with Title and Range Picker */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title || getMetricLabel(metricType)}</Text>
          {stats && (
            <Text style={styles.currentValue}>
              Current: <Text style={{ color: chartColor, fontWeight: '800' }}>{stats.latest} {unit}</Text>
            </Text>
          )}
        </View>

        <View style={styles.rangeSelector}>
          {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.rangeButton,
                timeRange === r && { backgroundColor: chartColor },
              ]}
              onPress={() => onTimeRangeChange(r)}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  timeRange === r && styles.rangeButtonTextActive,
                ]}
              >
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Summary Bar */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MIN</Text>
            <Text style={styles.statValue}>{stats.min} {unit}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>AVERAGE</Text>
            <Text style={styles.statValue}>{stats.avg} {unit}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MAX</Text>
            <Text style={styles.statValue}>{stats.max} {unit}</Text>
          </View>
        </View>
      )}

      {/* Visual Chart Area */}
      {filteredData.length === 0 ? (
        <EmptyState
          title="No Data Available"
          message={`No ${getMetricLabel(metricType).toLowerCase()} records found for ${timeRange}.`}
        />
      ) : (
        <View style={styles.chartContainer}>
          {/* Custom Responsive Mini Bar / Trend Grid that is 100% reliable across Mobile, Web, and Test */}
          <View style={styles.visualTrend}>
            {filteredData.slice(-16).map((item, index, arr) => {
              const minVal = stats ? stats.min * 0.9 : 0;
              const maxVal = stats ? stats.max * 1.1 : 100;
              const heightPct = Math.max(
                15,
                Math.min(95, ((item.value - minVal) / (maxVal - minVal || 1)) * 100)
              );

              return (
                <View key={`${item.id}-${item.measuredAt}-${index}`} style={styles.trendColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: chartColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>
                    {new Date(item.measuredAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.caption}>
            Showing recent chronological sensor telemetry points
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  currentValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  rangeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  chartContainer: {
    marginTop: 6,
  },
  visualTrend: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
  },
  barTrack: {
    flex: 1,
    width: '60%',
    maxWidth: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
    transform: [{ rotate: '-30deg' }],
  },
  caption: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
});
