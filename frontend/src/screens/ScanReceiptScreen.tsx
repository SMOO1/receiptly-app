// @author Zidane Virani

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { colors, fontSize, spacing, borderRadius } from '../theme';

export default function ScanReceiptScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to scan receipts.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to upload receipts.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleUpload() {
    if (!imageUri) return;

    setUploading(true);
    try {
      const receipt = await api.uploadReceipt(imageUri);
      navigation.navigate('ReviewReceipt', { receipt });
    } catch {
      // If upload endpoint isn't ready, navigate with just the image
      navigation.navigate('ReviewReceipt', { imageUri });
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Take a photo or upload from your gallery
        </Text>
      </View>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.retakeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={pickFromCamera}>
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="camera" size={32} color={colors.primary} />
            </View>
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionDesc}>
              Use your camera to scan a receipt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={pickFromGallery}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Ionicons name="images" size={32} color={colors.warning} />
            </View>
            <Text style={styles.optionTitle}>Upload Image</Text>
            <Text style={styles.optionDesc}>
              Choose a receipt from your gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {imageUri && (
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
              <Text style={styles.uploadText}>Process Receipt</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  optionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  preview: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  retakeText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: 40,
    height: 52,
    borderRadius: borderRadius.md,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
