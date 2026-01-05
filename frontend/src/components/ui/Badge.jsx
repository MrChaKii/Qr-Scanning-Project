import React from 'react';

export function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  // Tailwind CSS variant classes
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'bg-transparent border border-slate-200 text-slate-600',
  };

  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      ].join(' ')}
    >
      {children}
    </span>
  );
}
