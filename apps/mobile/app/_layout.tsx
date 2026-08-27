import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameSessionProvider } from '../context/GameSessionContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameSessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#020617' },
            animation: 'fade',
          }}
        />
      </GameSessionProvider>
    </SafeAreaProvider>
  );
}
