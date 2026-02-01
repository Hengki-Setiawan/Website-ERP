'use client';

import { useUIStore } from '@/lib/store';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { sidebarOpen } = useUIStore();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            {/* Main content */}
            <main
                className={`transition-all duration-300 min-h-screen ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                    }`}
            >
                <div className="p-4 lg:p-8 pt-20 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
