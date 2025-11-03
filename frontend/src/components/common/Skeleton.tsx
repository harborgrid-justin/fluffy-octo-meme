import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  className
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200';

  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

// Skeleton components for common patterns
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="100%" height={40} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <div className="flex space-x-3 mt-4">
        <Skeleton width={100} height={32} />
        <Skeleton width={100} height={32} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={32} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton width="40%" height={16} />
              <Skeleton width="60%" height={14} />
            </div>
          </div>
          <Skeleton width="100%" height={12} />
        </div>
      ))}
    </div>
  );
}
