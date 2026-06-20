import { type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Text, useThemeColor } from 'heroui-native';
import { Gradient } from './Gradient';
import { cn } from '@/lib/utils';

interface GradientButtonProps {
  label: string;
  onPress?: () => void;
  /** Optional trailing/leading icon node. */
  icon?: ReactNode;
  iconPosition?: 'leading' | 'trailing';
  className?: string;
  disabled?: boolean;
}

/**
 * VIPER primary action button: blue→violet gradient fill, rounded, with
 * an optional icon. Built on Pressable so the gradient fills the surface.
 */
export function GradientButton({
  label,
  onPress,
  icon,
  iconPosition = 'trailing',
  className,
  disabled = false,
}: GradientButtonProps) {
  const [blue, violet] = useThemeColor(['accent', 'foreground']);
  // Brand stops: electric blue -> violet.
  const colors: [string, string] = [blue, '#8b5cf6'];
  void violet;

  const gradientStyle: ViewStyle = {
    borderRadius: 16,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn('overflow-hidden rounded-2xl', disabled && 'opacity-50', className)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Gradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gradientStyle}
        className="flex-row items-center justify-center gap-3 px-6 py-4"
      >
        {icon && iconPosition === 'leading' ? <View>{icon}</View> : null}
        <Text className="text-base font-semibold tracking-wider text-white">{label}</Text>
        {icon && iconPosition === 'trailing' ? <View>{icon}</View> : null}
      </Gradient>
    </Pressable>
  );
}
