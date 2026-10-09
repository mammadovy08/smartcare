import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 17,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#F9FAFB',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="incident/[id]"
            options={{
              title: 'Incident Details',
              headerBackTitle: 'Alerts',
            }}
          />
          <Stack.Screen
            name="people/[id]"
            options={{
              title: 'Care Recipient Profile',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="+not-found"
            options={{
              title: 'Page Not Found',
            }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: 'Application Error' }} />
      {/* Fallback Screen */}
      <RootLayout />
    </SafeAreaProvider>
  );
}
