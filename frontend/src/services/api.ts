// Receiptly API Service
// @author Zidane Virani

import { Receipt } from '../types';

const API_BASE = 'http://10.0.2.2:8080/api'; // Android emulator localhost
// Use 'http://localhost:8080/api' for iOS simulator

const API_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
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

    return response.json();
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

    const response = await fetch(`${API_URL}/receipts/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiService();
