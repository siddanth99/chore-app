import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  Check, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  Shield, 
  Info,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type UpiStatus = "not_added" | "saved" | "verified" | "failed";

interface UpiStatusBadgeProps {
  status: UpiStatus;
}

const upiStatusConfig: Record<UpiStatus, {
  icon: React.ReactNode;
  label: string;
  bg: string;
  text: string;
  description: string;
}> = {
  not_added: {
    icon: <Clock className="h-4 w-4" />,
    label: "Not Added",
    bg: "bg-muted",
    text: "text-muted-foreground",
    description: "Add your UPI ID to receive payouts",
  },
  saved: {
    icon: <Clock className="h-4 w-4" />,
    label: "Saved (Unverified)",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    description: "UPI saved but pending verification",
  },
  verified: {
    icon: <Check className="h-4 w-4" />,
    label: "Verified",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    description: "Your UPI is verified and ready for payouts",
  },
  failed: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "Verification Failed",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    description: "Please check your UPI ID and try again",
  },
};

export function UpiStatusBadge({ status }: UpiStatusBadgeProps) {
  const config = upiStatusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}
    >
      <motion.span
        animate={status === "verified" ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: status === "verified" ? 3 : 0 }}
        className={config.text}
      >
        {config.icon}
      </motion.span>
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </motion.div>
  );
}

interface UpiInputSectionProps {
  upiId?: string;
  status: UpiStatus;
  onSave?: (upiId: string) => Promise<void>;
  isLoading?: boolean;
}

export function UpiInputSection({ upiId = "", status, onSave, isLoading = false }: UpiInputSectionProps) {
  const [value, setValue] = useState(upiId);

  const handleSave = async () => {
    if (onSave) {
      await onSave(value);
    }
  };

  const isValid = value.includes("@") && value.length > 3;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="yourname@upi"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-10 h-12 text-base"
        />
        {isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
          >
            <Check className="h-5 w-5" />
          </motion.div>
        )}
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {value && !isValid && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Please enter a valid UPI ID (e.g., name@upi)
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        onClick={handleSave}
        disabled={!isValid || isLoading}
        className="w-full h-11 bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Save UPI ID"
        )}
      </Button>
    </div>
  );
}

interface PayoutToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

export function PayoutToggle({ enabled, disabled = false, onChange }: PayoutToggleProps) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      disabled ? "border-border bg-muted/30" : "border-border bg-card"
    }`}>
      <div className="flex items-center gap-3">
        {enabled ? (
          <ToggleRight className="h-5 w-5 text-emerald-500" />
        ) : (
          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-foreground">Enable Payouts</p>
          <p className="text-sm text-muted-foreground">
            Receive payments automatically when chores are completed
          </p>
        </div>
      </div>
      <button
        onClick={() => onChange?.(!enabled)}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          disabled 
            ? "bg-muted cursor-not-allowed" 
            : enabled 
            ? "bg-emerald-500" 
            : "bg-muted-foreground/30"
        }`}
        aria-label="Toggle payouts"
      >
        <motion.span
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 left-0 w-4 h-4 rounded-full ${
            disabled ? "bg-muted-foreground/50" : "bg-white"
          } shadow-sm`}
        />
      </button>
    </div>
  );
}

interface PayoutSettingsCardProps {
  upiId?: string;
  status?: UpiStatus;
  payoutEnabled?: boolean;
}

export function PayoutSettingsCard({ 
  upiId = "", 
  status = "not_added",
  payoutEnabled = false 
}: PayoutSettingsCardProps) {
  const toast = useToast();
  const [currentUpi, setCurrentUpi] = useState(upiId);
  const [currentStatus, setCurrentStatus] = useState<UpiStatus>(status);
  const [isEnabled, setIsEnabled] = useState(payoutEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/worker/payout-settings');
        if (response.ok) {
          const data = await response.json();
          setCurrentUpi(data.upiId || '');
          setIsEnabled(data.payoutsEnabled || false);
          setCurrentStatus(data.upiId ? 'verified' : 'not_added');
        }
      } catch (error) {
        console.error('Error fetching payout settings:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUpiSave = async (newUpi: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/worker/payout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutUpiId: newUpi,
          payoutsEnabled: isEnabled, // Keep current toggle state
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUpi(data.upiId || '');
        setCurrentStatus(data.upiId ? 'verified' : 'not_added');
        toast.success('UPI ID saved', 'Your UPI ID has been updated successfully.');
      } else {
        const error = await response.json();
        toast.error('Error', error.error || 'Failed to save UPI ID');
      }
    } catch (error) {
      console.error('Error saving UPI ID:', error);
      toast.error('Error', 'Failed to save UPI ID. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = async (enabled: boolean) => {
    if (currentStatus !== 'verified' && enabled) {
      toast.error('UPI ID required', 'Please verify your UPI ID before enabling payouts.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/worker/payout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutUpiId: currentUpi,
          payoutsEnabled: enabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsEnabled(data.payoutsEnabled);
        toast.success(
          enabled ? 'Payouts enabled' : 'Payouts disabled',
          enabled 
            ? 'You will now receive payouts automatically.' 
            : 'Payouts have been disabled.'
        );
      } else {
        const error = await response.json();
        toast.error('Error', error.error || 'Failed to update payout settings');
      }
    } catch (error) {
      console.error('Error updating payout toggle:', error);
      toast.error('Error', 'Failed to update payout settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="relative px-6 py-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative">
          <h2 className="text-xl font-semibold text-foreground mb-1">Payout Settings</h2>
          <p className="text-muted-foreground">Manage how you receive your earnings</p>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div className="p-6 space-y-6">
        {/* UPI Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">UPI ID</h3>
            <UpiStatusBadge status={currentStatus} />
          </div>
          <UpiInputSection 
            upiId={currentUpi} 
            status={currentStatus}
            onSave={handleUpiSave}
            isLoading={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            {upiStatusConfig[currentStatus].description}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Payout Toggle */}
        <PayoutToggle
          enabled={isEnabled}
          disabled={currentStatus !== "verified" || isLoading}
          onChange={handleToggleChange}
        />

        {currentStatus !== "verified" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10"
          >
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Payouts can only be enabled after your UPI ID is verified.
            </p>
          </motion.div>
        )}
      </div>
      )}
      {/* Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>
    </motion.div>
  );
}
