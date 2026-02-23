// @author Zidane Virani

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, DashboardStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { colors, fontSize, spacing, borderRadius } from '../theme';

function computeStats(receipts: Receipt[]): DashboardStats {
  const totalSpent = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const receiptCount = receipts.length;
  const avgPerReceipt = receiptCount > 0 ? totalSpent / receiptCount : 0;

  const vendorCounts: Record<string, number> = {};
  receipts.forEach((r) => {
    if (r.vendor) {
      vendorCounts[r.vendor] = (vendorCounts[r.vendor] || 0) + 1;
    }
  });
  const topVendor =
    Object.entries(vendorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const now = new Date();
  const monthlySpent = receipts
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + (r.total || 0), 0);

  return { totalSpent, receiptCount, avgPerReceipt, topVendor, monthlySpent };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const receipts = await api.getAllReceipts();
      setStats(computeStats(receipts));
      setRecentReceipts(
        [...receipts]
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.greeting}>
        Hi, {user?.displayName || 'there'}!
      </Text>
      <Text style={styles.subtitle}>Here's your spending overview</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Spent</Text>
        <Text style={styles.heroAmount}>
          ${stats?.totalSpent.toFixed(2) ?? '0.00'}
        </Text>
        <Text style={styles.heroSub}>
          {stats?.receiptCount ?? 0} receipts scanned
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="trending-up-outline"
          label="This Month"
          value={`$${stats?.monthlySpent.toFixed(2) ?? '0.00'}`}
          color={colors.primary}
        />
        <StatCard
          icon="calculator-outline"
          label="Avg / Receipt"
          value={`$${stats?.avgPerReceipt.toFixed(2) ?? '0.00'}`}
          color={colors.warning}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="storefront-outline"
          label="Top Vendor"
          value={stats?.topVendor ?? 'N/A'}
          color="#8B5CF6"
        />
        <StatCard
          icon="receipt-outline"
          label="Total Receipts"
          value={`${stats?.receiptCount ?? 0}`}
          color="#3B82F6"
        />
      </View>

      {recentReceipts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentReceipts.map((r) => (
            <View key={r.id} style={styles.recentItem}>
              <View style={styles.recentDot} />
              <View style={styles.recentInfo}>
                <Text style={styles.recentVendor}>{r.vendor || 'Unknown'}</Text>
                <Text style={styles.recentDate}>
                  {new Date(r.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.recentTotal}>
                ${r.total?.toFixed(2) ?? '0.00'}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: spacing.xs,
  },
  heroSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentVendor: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  recentDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentTotal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
});
