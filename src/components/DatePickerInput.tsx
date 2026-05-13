import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { format, isValid, parseISO } from 'date-fns';

import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import { useAppSettings } from '../hooks/useAppSettings';
import { getWeekDays } from '../utils/dateUtils';

interface DatePickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  minimumDate?: string;
}

const toISODate = (date: Date): string => format(date, 'yyyy-MM-dd');

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
};

const monthTitle = (date: Date): string => format(date, 'MMMM yyyy');

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Pick a date',
  minimumDate,
}) => {
  const { settings, isCompact, layout, weekStartsOn } = useAppSettings();
  const selectedDate = parseDate(value);
  const minDate = parseDate(minimumDate);
  const [visible, setVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selectedDate ?? new Date(),
  );

  const weekDays = useMemo(() => getWeekDays(settings), [settings]);

  useEffect(() => {
    if (visible) setVisibleMonth(selectedDate ?? new Date());
  }, [selectedDate, visible]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() - weekStartsOn + 7) % 7;

    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      const date = new Date(year, month, dayNumber);
      return {
        date,
        iso: toISODate(date),
        isCurrentMonth: date.getMonth() === month,
      };
    });
  }, [visibleMonth, weekStartsOn]);

  const displayValue = selectedDate ? format(selectedDate, 'MMM d, yyyy') : '';

  const changeMonth = (offset: number) => {
    setVisibleMonth(
      prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  };

  const selectDate = (date: Date) => {
    if (minDate && date < minDate) return;
    onChange(toISODate(date));
    setVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setVisible(true)}
        style={[
          styles.inputContainer,
          isCompact
            ? styles.inputContainerCompact
            : styles.inputContainerComfortable,
          error ? styles.inputContainerError : null,
        ]}
      >
        <Text
          style={[
            styles.inputText,
            !displayValue ? styles.placeholderText : null,
          ]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.calendar, { padding: layout.cardPadding }]}
          >
            <View
              style={[
                styles.calendarHeader,
                { marginBottom: isCompact ? Spacing.sm : Spacing.md },
              ]}
            >
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={[
                  styles.iconButton,
                  isCompact
                    ? styles.iconButtonCompact
                    : styles.iconButtonDefault,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthTitle(visibleMonth)}</Text>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={[
                  styles.iconButton,
                  isCompact
                    ? styles.iconButtonCompact
                    : styles.iconButtonDefault,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map(day => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map(day => {
                const isSelected = day.iso === value;
                const isDisabled = !!minDate && day.date < minDate;
                return (
                  <TouchableOpacity
                    key={day.iso}
                    onPress={() => selectDate(day.date)}
                    disabled={isDisabled}
                    style={[
                      styles.dayButton,
                      isSelected ? styles.dayButtonSelected : null,
                      isDisabled ? styles.dayButtonDisabled : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !day.isCurrentMonth ? styles.dayTextMuted : null,
                        isSelected ? styles.dayTextSelected : null,
                        isDisabled ? styles.dayTextDisabled : null,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inputContainerCompact: { minHeight: 40 },
  inputContainerComfortable: { minHeight: 46 },
  inputContainerError: { borderColor: Colors.danger },
  inputText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  placeholderText: { color: Colors.textDisabled },
  error: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.35)',
    padding: Spacing.base,
  },
  calendar: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDefault: {
    width: 40,
    height: 40,
  },
  iconButtonCompact: {
    width: 34,
    height: 34,
  },
  monthTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayButtonDisabled: { opacity: 0.35 },
  dayText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  dayTextMuted: { color: Colors.textDisabled },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  dayTextDisabled: { color: Colors.textDisabled },
});
