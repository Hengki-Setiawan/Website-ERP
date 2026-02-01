'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Users,
    Truck,
    ShoppingCart,
    Receipt,
    Wallet,
    BarChart3,
    Database,
    Bot,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu
} from 'lucide-react';
import { useUIStore, useSettingsStore, useAuthStore } from '@/lib/store';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { settings } = useSettingsStore();
    const { user, logout } = useAuthStore();

    // Grouped navigation
    const navGroups: NavGroup[] = [
        {
            label: '',
            items: [
                { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            label: 'BISNIS',
            items: [
                { href: '/dashboard/products', label: 'Produk', icon: Package },
                { href: '/dashboard/customers', label: 'Pelanggan', icon: Users },
                { href: '/dashboard/suppliers', label: 'Supplier', icon: Truck },
            ]
        },
        {
            label: 'TRANSAKSI',
            items: [
                { href: '/dashboard/pos', label: 'Kasir (POS)', icon: ShoppingCart },
                { href: '/dashboard/transactions', label: 'Penjualan', icon: Receipt },
                { href: '/dashboard/expenses', label: 'Pengeluaran', icon: Wallet },
            ]
        },
        {
            label: 'LAPORAN',
            items: [
                { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3 },
            ]
        },
    ];

    const systemItems: NavItem[] = [
        { href: '/dashboard/database', label: 'Database', icon: Database },
        { href: '/dashboard/ai', label: 'Asisten AI', icon: Bot },
        { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-30 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'
                    } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                            >
                                ERP
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                {settings.businessName || 'ERP UMKM'}
                            </span>
                        </div>
                    ) : (
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto"
                            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                        >
                            ERP
                        </div>
                    )}

                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    >
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    {navGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className={group.label ? 'mt-4' : ''}>
                            {/* Group Label */}
                            {group.label && sidebarOpen && (
                                <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                                    {group.label}
                                </p>
                            )}
                            {group.label && !sidebarOpen && (
                                <div className="my-2 mx-4 border-t border-gray-200 dark:border-gray-700" />
                            )}

                            {/* Group Items */}
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const active = isActive(item.href);
                                    const Icon = item.icon;

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active
                                                    ? 'bg-gradient-to-r text-white shadow-md'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                                style={active ? {
                                                    backgroundImage: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
                                                } : undefined}
                                                title={!sidebarOpen ? item.label : undefined}
                                            >
                                                <Icon size={20} className={sidebarOpen ? '' : 'mx-auto'} />
                                                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 py-4 px-3">
                    {sidebarOpen && (
                        <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                            SISTEM
                        </p>
                    )}
                    <ul className="space-y-1">
                        {systemItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        title={!sidebarOpen ? item.label : undefined}
                                    >
                                        <Icon size={20} className={sidebarOpen ? '' : 'mx-auto'} />
                                        {sidebarOpen && <span className="font-medium">{item.label}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* User Info */}
                    {sidebarOpen && user && (
                        <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {user.role}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        window.location.href = '/login';
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile menu button */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-20 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
            >
                <Menu size={24} />
            </button>
        </>
    );
}
