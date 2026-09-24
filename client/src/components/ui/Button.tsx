import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = Omit<PressableProps, 'children' | 'style' | 'className'> & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, variant = 'primary', disabled = false, accessibilityLabel, accessibilityState, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      className={`min-h-14 min-w-36 items-center justify-center rounded-button border px-lg py-md web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-4 web:focus-visible:outline-brand ${
        variant === 'primary'
          ? 'border-brand bg-brand'
          : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
      } ${disabled ? 'opacity-50' : 'hover:opacity-80 active:opacity-70'}`}
    >
      <Text className={`text-base font-semibold text-center ${variant === 'primary' ? 'text-on-brand' : 'text-light-text dark:text-dark-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

