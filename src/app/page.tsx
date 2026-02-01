import Link from "next/link";
import { ArrowRight, BarChart3, Bot, Database, Palette, Shield, Smartphone } from "lucide-react";

export default function Home() {
  const features = [
    { icon: Database, title: "Multi-Mode Database", desc: "Cloud, Local, atau Hybrid dengan Turso" },
    { icon: Bot, title: "AI Assistant", desc: "Chatbot cerdas yang memahami bisnis Anda" },
    { icon: Palette, title: "Full Customization", desc: "Warna, icon, field, semua bisa diubah" },
    { icon: Shield, title: "Keamanan", desc: "Enkripsi, RBAC, dan audit logs" },
    { icon: BarChart3, title: "Analytics", desc: "Laporan dan insight bisnis otomatis" },
    { icon: Smartphone, title: "PWA Ready", desc: "Install seperti aplikasi native" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold mb-6 shadow-lg">
            ERP
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Template ERP Lengkap untuk{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              UMKM Indonesia
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Website template ERP yang bisa disesuaikan 100% sesuai kebutuhan bisnis Anda.
            Dengan integrasi AI cerdas dan database yang fleksibel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Masuk ke Dashboard
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              Coba Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-gray-500 dark:text-gray-400">
          <p>ERP Template untuk UMKM Indonesia 🇮🇩</p>
        </div>
      </div>
    </div>
  );
}
