import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppIcon } from '@/components/app-icon';

export function ProfileAvatar({
  uri,
  size = 48,
  color = '#1677FF',
  style,
}: {
  uri?: string | null;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const radius = size / 2;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
        />
      ) : (
        <AppIcon name="profile" size={Math.round(size * 0.48)} color="#FFFFFF" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
