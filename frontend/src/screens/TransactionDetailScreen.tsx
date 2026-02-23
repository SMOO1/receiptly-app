// @author Zidane Virani

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { colors, fontSize, spacing, borderRadius } from '../theme';

type DetailRoute = RouteProp<RootStackParamList, 'TransactionDetail'>;

export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();
  const { receipt } = route.params;

  const formattedDate = new Date(receipt.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async function handleDelete() {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteReceipt(receipt.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {receipt.image_url ? (
        <Image source={{ uri: receipt.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={48} color={colors.textLight} />
          <Text style={styles.imagePlaceholderText}>No image available</Text>
        </View>
      )}

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total</Text>
        <Text style={styles.amount}>
          ${receipt.total?.toFixed(2) ?? '0.00'}
        </Text>
      </View>

      <View style={styles.detailsCard}>
        <DetailRow
          icon="storefront-outline"
          label="Vendor"
          value={receipt.vendor || 'Unknown'}
        />
        <View style={styles.divider} />
        <DetailRow icon="calendar-outline" label="Date" value={formattedDate} />
        <View style={styles.divider} />
        <DetailRow
          icon="finger-print-outline"
          label="Receipt ID"
          value={receipt.id.slice(0, 8) + '...'}
        />
        {receipt.created_at && (
          <>
            <View style={styles.divider} />
            <DetailRow
              icon="time-outline"
              label="Scanned"
              value={new Date(receipt.created_at).toLocaleDateString()}
            />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
        <Text style={styles.deleteText}>Delete Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: colors.surfaceAlt,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: '600',
  },
});
