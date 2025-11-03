import React, { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  outline?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  outline = false,
  className,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles = outline ? {
    default: 'bg-transparent border border-gray-500 text-gray-700',
    primary: 'bg-transparent border border-blue-500 text-blue-700',
    success: 'bg-transparent border border-green-500 text-green-700',
    warning: 'bg-transparent border border-orange-500 text-orange-700',
    error: 'bg-transparent border border-red-500 text-red-700',
    info: 'bg-transparent border border-blue-500 text-blue-700'
  } : {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const dotColor = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={clsx('w-2 h-2 rounded-full mr-1.5', dotColor[variant])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
