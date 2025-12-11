"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center md:text-left"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground bg-muted/50">
              <Calendar className="h-3 w-3" />
              Last updated: {lastUpdated}
            </div>
          )}
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm md:shadow-md p-6 md:p-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

// Reusable section component for legal pages
export const LegalSection = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`border-t border-border pt-6 mt-6 first:border-t-0 first:pt-0 first:mt-0 ${className}`}>
    <h2 className="text-lg md:text-xl font-semibold text-foreground">{title}</h2>
    <div className="mt-3 text-sm md:text-base leading-relaxed text-muted-foreground space-y-3">
      {children}
    </div>
  </section>
);

export default LegalPageLayout;
