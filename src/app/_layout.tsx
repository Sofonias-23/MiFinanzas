import { Stack } from 'expo-router';
import { FinanceProvider } from '@/context/finance-context';

export default function RootLayout() {
  return (
    <FinanceProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#0B1220',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="nuevo-gasto"
          options={{
            presentation: 'card',
          }}
        />
      </Stack>
    </FinanceProvider>
  );
}
