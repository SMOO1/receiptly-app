// @author Zidane Virani

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { colors, fontSize, spacing, borderRadius } from '../theme';

type ReviewRoute = RouteProp<RootStackParamList, 'ReviewReceipt'>;

export default function ReviewReceiptScreen() {
  const navigation = useNavigation();
  const route = useRoute<ReviewRoute>();
  const existingReceipt = route.params?.receipt;
  const imageUri = route.params?.imageUri;

  const [vendor, setVendor] = useState(existingReceipt?.vendor || '');
  const [date, setDate] = useState(
    existingReceipt?.date || new Date().toISOString().split('T')[0]
  );
  const [total, setTotal] = useState(
    existingReceipt?.total?.toString() || ''
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!vendor.trim()) {
      Alert.alert('Missing Field', 'Please enter a vendor name.');
      return;
    }
    if (!total.trim() || isNaN(parseFloat(total))) {
      Alert.alert('Invalid Total', 'Please enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      if (existingReceipt?.id) {
        await api.updateReceipt(existingReceipt.id, {
          vendor: vendor.trim(),
          date,
          total: parseFloat(total),
        });
      } else {
        await api.createReceipt({
          vendor: vendor.trim(),
          date,
          total: parseFloat(total),
          image_url: imageUri || '',
        });
      }
      Alert.alert('Success', 'Receipt saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save receipt');
    } finally {
      setSaving(false);
    }
  }

  const previewUri = existingReceipt?.image_url || imageUri;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="receipt-outline" size={40} color={colors.textLight} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Receipt Details</Text>
      <Text style={styles.sectionSubtitle}>
        Review and edit the extracted information
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Vendor</Text>
        <View style={styles.inputContainer}>
          <Ionicons
            name="storefront-outline"
            size={20}
            color={colors.textLight}
          />
          <TextInput
            style={styles.input}
            value={vendor}
            onChangeText={setVendor}
            placeholder="e.g. Walmart, Target"
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Date</Text>
        <View style={styles.inputContainer}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.textLight}
          />
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Total Amount</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={setTotal}
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.saveText}>
              {existingReceipt?.id ? 'Update Receipt' : 'Save Receipt'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
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
    height: 200,
    backgroundColor: colors.surfaceAlt,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  fieldContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dollarSign: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    height: 52,
    borderRadius: borderRadius.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
