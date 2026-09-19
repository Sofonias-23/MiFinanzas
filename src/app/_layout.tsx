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
        <Stack.Screen name="login" />
        <Stack.Screen name="index" />
        <Stack.Screen name="mi-dinero" options={{ presentation: 'card' }} />
        <Stack.Screen name="movimientos" />
        <Stack.Screen name="estadisticas" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="pareja" options={{ presentation: 'card' }} />
        <Stack.Screen name="deudas" options={{ presentation: 'card' }} />
        <Stack.Screen name="saldar-deuda" options={{ presentation: 'card' }} />
        <Stack.Screen name="nuevo-gasto" options={{ presentation: 'card' }} />
        <Stack.Screen name="nuevo-ingreso" options={{ presentation: 'card' }} />
        <Stack.Screen name="categorias" options={{ presentation: 'card' }} />
        <Stack.Screen name="metodos-pago" options={{ presentation: 'card' }} />
      </Stack>
    </FinanceProvider>
  );
}
