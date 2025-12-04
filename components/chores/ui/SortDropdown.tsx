'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { SortOption } from '../../types';
import { cn } from '@/lib/utils';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget_high', label: 'Budget: High → Low' },
  { value: 'budget_low', label: 'Budget: Low → High' },
  { value: 'distance', label: 'Distance' },
];

/**
 * SortDropdown - An animated dropdown for sorting chores.
 * Features smooth open/close animation and accessible keyboard navigation.
 */
export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = SORT_OPTIONS.findIndex(opt => opt.value === value);
      const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
      onChange(SORT_OPTIONS[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = SORT_OPTIONS.findIndex(opt => opt.value === value);
      const prevIndex = (currentIndex - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length;
      onChange(SORT_OPTIONS[prevIndex].value);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50',
          'text-sm font-medium text-foreground hover:bg-secondary transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Sort by: ${selectedOption.label}`}
      >
        <span>Sort: {selectedOption.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-2 right-0 w-56 py-2 glass-card shadow-lg"
            role="listbox"
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                  option.value === value
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-secondary/50'
                )}
                role="option"
                aria-selected={option.value === value}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
