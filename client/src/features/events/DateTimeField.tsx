import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Button } from '@/components/ui/Button';
import { textStyle } from '@/features/profiles/ProfileFields';
import type { DateTimeFieldProps } from './DateTimeField.types';
// UTC is only a carrier for wall-clock fields here. Conversion to the event's
// selected IANA timezone happens in dates.ts, never through the device timezone.
export function DateTimeField({ label, value, onChange, disabled, error, id }: DateTimeFieldProps) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const carrier = value ? new Date(value + ':00Z') : new Date();
  const safeDate = Number.isNaN(carrier.getTime()) ? new Date() : carrier;
  function accept(date: Date, selectedMode: 'date' | 'time') {
    const current = value || safeDate.toISOString().slice(0, 16);
    const next = date.toISOString().slice(0, 16);
    onChange(selectedMode === 'date' ? next.slice(0, 10) + current.slice(10) : current.slice(0, 11) + next.slice(11));
    setMode(null);
  }
  function open(selectedMode: 'date' | 'time') {
    if (Platform.OS === 'android') DateTimePickerAndroid.open({
      value: safeDate, mode: selectedMode, timeZoneName: 'UTC', is24Hour: true,
      onValueChange: (_event, date) => accept(date, selectedMode),
    });
    else setMode(selectedMode);
  }
  return <View className="gap-sm">
    <Text nativeID={id} className={textStyle}>{label} *</Text>
    <Text className={textStyle}>{value.replace('T', ' ') || 'Choose date and time'}</Text>
    <Button label={label + ' date'} disabled={disabled} variant="secondary" onPress={() => open('date')} />
    <Button label={label + ' time'} disabled={disabled} variant="secondary" onPress={() => open('time')} />
    {mode ? <DateTimePicker value={safeDate} mode={mode} timeZoneName="UTC" display="default"
      onValueChange={(_event, date) => accept(date, mode)} onDismiss={() => setMode(null)} /> : null}
    {error ? <Text nativeID={id + '-error'} accessibilityRole="alert" className={textStyle}>{error}</Text> : null}
  </View>;
}
