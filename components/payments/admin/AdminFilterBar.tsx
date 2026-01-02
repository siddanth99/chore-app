import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminFilterBarProps {
  onSearch?: (query: string) => void;
  onStatusFilter?: (status: string) => void;
  onDateRange?: (range: { start: string; end: string }) => void;
  statusOptions?: string[];
  activeStatus?: string;
}

const defaultStatuses = ["All", "Pending", "Success", "Failed", "Refunded"];

export function AdminFilterBar({
  onSearch,
  onStatusFilter,
  statusOptions = defaultStatuses,
  activeStatus = "All",
}: AdminFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(activeStatus);

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    onStatusFilter?.(status);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border bg-card">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by user, chore, or ID..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-10"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {statusOptions.map((status) => (
          <motion.button
            key={status}
            onClick={() => handleStatusClick(status)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              selectedStatus === status
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {status}
          </motion.button>
        ))}
      </div>

      {/* Date range */}
      <button 
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
        // TODO: onClick -> open date range picker
      >
        <Calendar className="h-4 w-4" />
        <span>Date Range</span>
      </button>
    </div>
  );
}
