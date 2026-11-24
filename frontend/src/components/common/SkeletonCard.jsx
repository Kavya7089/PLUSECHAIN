import React from 'react';

export function SkeletonCard({ className = '', height = 'h-32' }) {
  return (
    <div
      className={`rounded-xl bg-abyss-card border border-abyss-border p-5 animate-pulse ${height} ${className}`}
    >
      <div className="h-4 bg-abyss-elevated rounded w-1/3 mb-3"></div>
      <div className="h-3 bg-abyss-elevated/70 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-abyss-elevated/50 rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 5 }) {
  return (
    <div className="rounded-xl bg-abyss-card border border-abyss-border overflow-hidden p-4 space-y-3 animate-pulse">
      <div className="h-6 bg-abyss-elevated rounded w-1/4 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-abyss-elevated/60 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkeletonCard;
