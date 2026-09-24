import { Text, View } from 'react-native';
import { textStyle } from '@/features/profiles/ProfileFields';
import type { DateTimeFieldProps } from './DateTimeField.types';
export function DateTimeField({ label, value, onChange, disabled, error, id }: DateTimeFieldProps) {
  return <View className="gap-sm">
    <label htmlFor={id}><Text className={textStyle}>{label} *</Text></label>
    <input id={id} aria-label={label} aria-invalid={!!error} aria-describedby={error ? id + '-error' : undefined}
      type="datetime-local" step={60} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}
      className="min-h-14 w-full min-w-0 rounded-button border border-light-border bg-light-surface p-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
      style={{ boxSizing: 'border-box', colorScheme: 'light dark' }} />
    {error ? <Text nativeID={id + '-error'} accessibilityRole="alert" className={textStyle}>{error}</Text> : null}
  </View>;
}
