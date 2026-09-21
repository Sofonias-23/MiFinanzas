import { AppIconName } from '@/components/app-icon';

export function categoryIconName(slug: string): AppIconName {
  if (slug === 'comida') return 'food';
  if (slug === 'transporte') return 'car';
  if (slug === 'hogar') return 'house';
  if (slug === 'ocio') return 'movie';
  if (slug === 'salud') return 'health';
  if (slug === 'compras') return 'shopping';
  if (slug === 'servicios') return 'bolt';
  if (slug === 'educacion') return 'education';
  return 'more';
}

export function paymentIconName(slug: string): AppIconName {
  if (slug === 'efectivo') return 'cash';
  if (slug === 'transferencia') return 'bank';
  if (slug === 'debito' || slug === 'credito') return 'card';
  return 'wallet';
}
