import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';

export default function TabLayout() {
  const activeIncidentsCount = useAppStore(
    (state) => state.incidents.filter((i) => i.status === 'new' || i.status === 'acknowledged').length
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#111827',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incident Center',
          tabBarLabel: 'Alerts',
          tabBarBadge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#DC2626',
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Health Trends',
          tabBarLabel: 'Trends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Connected Devices',
          tabBarLabel: 'Devices',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chip" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings & Contacts',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
