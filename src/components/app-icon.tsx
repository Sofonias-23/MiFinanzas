import { SymbolView } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export type AppIconName =
  | 'home'
  | 'categories'
  | 'stats'
  | 'profile'
  | 'expenses'
  | 'debts'
  | 'settings'
  | 'lock'
  | 'heart'
  | 'bolt'
  | 'people'
  | 'add'
  | 'income'
  | 'wallet'
  | 'eye'
  | 'chat'
  | 'settle'
  | 'receipt'
  | 'cash'
  | 'card'
  | 'bank'
  | 'transfer'
  | 'food'
  | 'car'
  | 'movie'
  | 'shopping'
  | 'health'
  | 'house'
  | 'education'
  | 'more'
  | 'back'
  | 'send'
  | 'check';

const ICONS: Record<AppIconName, { ios: string; android: string; web: string }> = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  categories: { ios: 'square.grid.2x2.fill', android: 'category', web: 'category' },
  stats: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
  expenses: { ios: 'list.bullet.rectangle.fill', android: 'receipt_long', web: 'receipt_long' },
  debts: { ios: 'scale.3d', android: 'balance', web: 'balance' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  bolt: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  people: { ios: 'person.2.fill', android: 'group', web: 'group' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  income: { ios: 'arrow.down.left.circle.fill', android: 'trending_up', web: 'trending_up' },
  wallet: { ios: 'wallet.bifold.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  eye: { ios: 'eye.fill', android: 'visibility', web: 'visibility' },
  chat: { ios: 'bubble.left.and.bubble.right.fill', android: 'chat', web: 'chat' },
  settle: { ios: 'arrow.left.arrow.right.circle.fill', android: 'sync_alt', web: 'sync_alt' },
  receipt: { ios: 'receipt.fill', android: 'receipt_long', web: 'receipt_long' },
  cash: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
  card: { ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' },
  bank: { ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' },
  transfer: { ios: 'arrow.left.arrow.right', android: 'sync_alt', web: 'sync_alt' },
  food: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  car: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  movie: { ios: 'film.fill', android: 'movie', web: 'movie' },
  shopping: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' },
  health: { ios: 'heart.text.square.fill', android: 'health_and_safety', web: 'health_and_safety' },
  house: { ios: 'house.fill', android: 'home', web: 'home' },
  education: { ios: 'graduationcap.fill', android: 'school', web: 'school' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  back: { ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' },
  send: { ios: 'paperplane.fill', android: 'send', web: 'send' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
};

export function AppIcon({
  name,
  size = 20,
  color = '#FFFFFF',
  style,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SymbolView
      name={ICONS[name] as any}
      size={size}
      tintColor={color}
      style={[{ width: size, height: size }, style]}
    />
  );
}
