// @author Zidane Virani

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt } from '../types';
import { colors, fontSize, spacing, borderRadius } from '../theme';

interface Props {
  receipt: Receipt;
  onPress: (receipt: Receipt) => void;
}

export default function ReceiptCard({ receipt, onPress }: Props) {
  const formattedDate = new Date(receipt.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(receipt)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="receipt-outline" size={24} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.vendor} numberOfLines={1}>
          {receipt.vendor || 'Unknown Vendor'}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <View style={styles.totalContainer}>
        <Text style={styles.total}>
          ${receipt.total?.toFixed(2) ?? '0.00'}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textLight}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  vendor: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  total: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
});
