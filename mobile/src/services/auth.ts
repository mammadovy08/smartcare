// Auth Service
// Mock implementation for Phase 1, Supabase-ready for Phase 3+

import type { User, AuthResult, SignUpData } from '@/types';
import { backendService } from '@/adapters/backend';
import { storage } from './storage';

export interface AuthService {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(data: SignUpData): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<{ accessToken: string } | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
  resetPassword(email: string): Promise<void>;
}

class MockAuthService implements AuthService {
  private user: User | null = null;
  private callbacks: Array<(user: User | null) => void> = [];

  async signIn(email: string, password: string): Promise<AuthResult> {
    const result = await backendService.signIn(email, password);
    this.user = result.user;
    await storage.setAuthToken(result.session.accessToken);
    this.notifyCallbacks(this.user);
    return result;
  }

  async signUp(data: SignUpData): Promise<AuthResult> {
    const result = await backendService.signUp(data);
    this.user = result.user;
    await storage.setAuthToken(result.session.accessToken);
    this.notifyCallbacks(this.user);
    return result;
  }

  async signOut(): Promise<void> {
    await backendService.signOut();
    this.user = null;
    await storage.removeAuthToken();
    this.notifyCallbacks(null);
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.user) return this.user;
    const token = await storage.getAuthToken();
    if (token) {
      this.user = await backendService.getCurrentUser();
      return this.user;
    }
    return null;
  }

  async getSession(): Promise<{ accessToken: string } | null> {
    const token = await storage.getAuthToken();
    return token ? { accessToken: token } : null;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.callbacks.push(callback);
    // Call immediately with current state
    this.getCurrentUser().then(user => callback(user));
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  async resetPassword(email: string): Promise<void> {
    // Mock implementation
    console.log('Password reset requested for:', email);
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
  }

  private notifyCallbacks(user: User | null): void {
    this.callbacks.forEach(cb => cb(user));
  }
}

export const authService = new MockAuthService();

// Helper hook for React components
export function useAuth() {
  // This would be implemented with React context in a real app
  return {
    user: null as User | null,
    loading: false,
    signIn: authService.signIn.bind(authService),
    signOut: authService.signOut.bind(authService),
  };
}