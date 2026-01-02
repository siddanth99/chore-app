import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, CreditCard, Wallet, BarChart3, Settings, Shield } from "lucide-react";

interface PaymentsShellProps {
  children: React.ReactNode;
  activeTab?: string;
  tabs?: { id: string; label: string; icon: React.ReactNode }[];
  onTabChange?: (tabId: string) => void;
  showThemeToggle?: boolean;
}

export function PaymentsShell({
  children,
  activeTab,
  tabs,
  onTabChange,
  showThemeToggle = true,
}: PaymentsShellProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300`}>
      {/* Sub-navigation */}
      {tabs && tabs.length > 0 && (
        <div className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <nav className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </nav>

              {showThemeToggle && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait">
                    {isDark ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export const defaultPaymentTabs = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { id: "payouts", label: "Payouts", icon: <Wallet className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export const adminPaymentTabs = [
  { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { id: "payouts", label: "Payouts", icon: <Wallet className="h-4 w-4" /> },
  { id: "disputes", label: "Disputes", icon: <Shield className="h-4 w-4" /> },
];
