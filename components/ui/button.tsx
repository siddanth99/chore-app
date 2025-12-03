// web/components/ui/button.tsx

'use client';

/**
 * Exports both named and default Button for compatibility.
 * Simple, production-ready Button using Tailwind classes.
 */

import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'secondary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ');
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/* eslint-disable react/display-name */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center rounded-2xl font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizeMap: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const variantMap: Record<Variant, string> = {
    primary:
      'bg-[#4F46E5] text-white shadow hover:shadow-lg active:translate-y-0.5 focus:ring-[#4F46E5]/50',
    secondary:
      'bg-slate-600 text-white shadow hover:bg-slate-500 active:translate-y-0.5 focus:ring-slate-400',
    danger:
      'bg-red-600 text-white shadow hover:bg-red-500 active:translate-y-0.5 focus:ring-red-400',
    outline:
      'bg-transparent border border-slate-700 text-slate-200 hover:bg-white/3 active:translate-y-0.5 focus:ring-slate-400',
    ghost:
      'bg-transparent text-slate-200 hover:bg-white/2 active:translate-y-0.5 focus:ring-slate-400',
  };

  const classes = cn(base, sizeMap[size], variantMap[variant], className || '');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
