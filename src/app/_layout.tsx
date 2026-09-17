import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
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
  );
}
