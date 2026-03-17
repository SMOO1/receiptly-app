// Receiptly API Service
// @author Zidane Virani

import { Receipt, User } from '../types';

const API_BASE = 'http://10.0.2.2:8080/api'; // Android emulator localhost
// Use 'http://localhost:8080/api' for iOS simulator

const API_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';

export interface UserSettings {
  userId: string;
  googleSheetId: string | null;
  autoExport: boolean;
}

class ApiService {
  private token: string | null = null;
  private userId: string | null = null;
  private userEmail: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setUser(user: User | null) {
    this.userId = user?.id || null;
    this.userEmail = user?.email || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }
    if (this.userEmail) {
      headers['X-User-Email'] = this.userEmail;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `API Error ${response.status}: ${errorBody || response.statusText}`
      );
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  async getUserSettings(): Promise<{settings: UserSettings, serviceAccountEmail: string}> {
    return this.request<{settings: UserSettings, serviceAccountEmail: string}>('/user-settings');
  }

  async connectGoogleSheet(action: 'create' | 'link' | 'disconnect', sheetUrl?: string): Promise<UserSettings> {
    return this.request<UserSettings>('/user-settings/connect', {
      method: 'POST',
      body: JSON.stringify({ action, sheetUrl }),
    });
  }

  async updateUserSettings(autoExport: boolean): Promise<UserSettings> {
    return this.request<UserSettings>('/user-settings', {
      method: 'PUT',
      body: JSON.stringify({ autoExport }),
    });
  }

  async syncAllReceipts(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/user-settings/sync', {
      method: 'POST',
    });
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return this.request<Receipt[]>('/receipts');
  }

  async getReceiptById(id: string): Promise<Receipt> {
    return this.request<Receipt>(`/receipts/${id}`);
  }

  async createReceipt(receipt: Partial<Receipt>): Promise<Receipt> {
    return this.request<Receipt>('/receipts', {
      method: 'POST',
      body: JSON.stringify(receipt),
    });
  }

  async updateReceipt(
    id: string,
    receipt: Partial<Receipt>
  ): Promise<Receipt> {
    return this.request<Receipt>(`/receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(receipt),
    });
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.request(`/receipts/${id}`, { method: 'DELETE' });
  }

  async getSignedUrl(id: string): Promise<string> {
    const data = await this.request<{ signedUrl: string }>(`/receipts/${id}/signed-url`);
    return data.signedUrl;
  }

  async uploadReceipt(imageUri: string): Promise<Receipt> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }
    // Do NOT set Content-Type — fetch will set it with the correct boundary
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    return response.json();
  }
}

export const api = new ApiService();
