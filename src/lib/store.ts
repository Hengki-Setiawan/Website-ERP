// Global State Store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, User, Module } from '@/types';

// Settings Store
interface SettingsState {
    settings: Partial<Settings>;
    setSettings: (settings: Partial<Settings>) => void;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: {
                businessName: 'Toko UMKM',
                primaryColor: '#3b82f6',
                secondaryColor: '#10b981',
                accentColor: '#f59e0b',
                darkMode: false,
                databaseMode: 'local',
                aiProvider: 'groq',
                aiEnabled: true,
                language: 'id',
                currency: 'IDR',
                timezone: 'Asia/Jakarta',
            },
            setSettings: (settings) => set({ settings }),
            updateSetting: (key, value) =>
                set((state) => ({
                    settings: { ...state.settings, [key]: value },
                })),
        }),
        {
            name: 'erp-settings',
        }
    )
);

// Auth Store
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'erp-auth',
        }
    )
);

// Modules Store
interface ModulesState {
    modules: Module[];
    setModules: (modules: Module[]) => void;
    toggleModule: (moduleId: string) => void;
}

export const useModulesStore = create<ModulesState>()(
    persist(
        (set) => ({
            modules: [
                { id: 'products', name: 'Produk', slug: 'products', icon: 'package', description: 'Kelola produk dan inventori', enabled: true, order: 1 },
                { id: 'pos', name: 'Kasir (POS)', slug: 'pos', icon: 'shopping-cart', description: 'Point of Sale - Penjualan', enabled: true, order: 2 },
                { id: 'customers', name: 'Pelanggan', slug: 'customers', icon: 'users', description: 'Kelola data pelanggan', enabled: true, order: 3 },
                { id: 'suppliers', name: 'Supplier', slug: 'suppliers', icon: 'truck', description: 'Kelola data supplier', enabled: true, order: 4 },
                { id: 'transactions', name: 'Transaksi', slug: 'transactions', icon: 'receipt', description: 'Riwayat transaksi', enabled: true, order: 5 },
                { id: 'expenses', name: 'Pengeluaran', slug: 'expenses', icon: 'credit-card', description: 'Catat pengeluaran', enabled: true, order: 6 },
                { id: 'reports', name: 'Laporan', slug: 'reports', icon: 'bar-chart-3', description: 'Laporan dan analitik', enabled: true, order: 7 },
            ],
            setModules: (modules) => set({ modules }),
            toggleModule: (moduleId) =>
                set((state) => ({
                    modules: state.modules.map((m) =>
                        m.id === moduleId ? { ...m, enabled: !m.enabled } : m
                    ),
                })),
        }),
        {
            name: 'erp-modules',
        }
    )
);

// UI Store
interface UIState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    currentPage: 'dashboard',
    setCurrentPage: (page) => set({ currentPage: page }),
}));
