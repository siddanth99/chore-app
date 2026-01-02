import React from "react";
import { motion } from "framer-motion";

interface DataPoint {
  month: string;
  earnings: number;
  payouts: number;
}

const mockChartData: DataPoint[] = [
  { month: "Jul", earnings: 3200, payouts: 3000 },
  { month: "Aug", earnings: 4100, payouts: 3800 },
  { month: "Sep", earnings: 3800, payouts: 3600 },
  { month: "Oct", earnings: 5200, payouts: 5000 },
  { month: "Nov", earnings: 4800, payouts: 4500 },
  { month: "Dec", earnings: 6500, payouts: 5800 },
];

interface EarningsChartProps {
  data: DataPoint[];
}

export function EarningsChart({ data }: EarningsChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.earnings, d.payouts)));
  const chartHeight = 200;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Earnings Overview</h3>
          <p className="text-sm text-muted-foreground">Last 6 months performance</p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Earnings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Payouts</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-border/50" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end justify-between gap-2 px-2">
          {data.map((item, index) => {
            const earningsHeight = (item.earnings / maxValue) * chartHeight;
            const payoutsHeight = (item.payouts / maxValue) * chartHeight;

            return (
              <div key={item.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Earnings bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: earningsHeight }}
                    transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="w-5 bg-gradient-to-t from-primary to-primary/70 rounded-t-md relative group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{item.earnings.toLocaleString()}
                    </div>
                  </motion.div>
                  
                  {/* Payouts bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: payoutsHeight }}
                    transition={{ delay: index * 0.1 + 0.1, duration: 0.5, ease: "easeOut" }}
                    className="w-5 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md relative group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border border-border rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{item.payouts.toLocaleString()}
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-2 mt-3">
        {data.map((item) => (
          <span key={item.month} className="text-xs text-muted-foreground flex-1 text-center">
            {item.month}
          </span>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-xl font-bold text-foreground">
            ₹{data.reduce((sum, d) => sum + d.earnings, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Payouts</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{data.reduce((sum, d) => sum + d.payouts, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
