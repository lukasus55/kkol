import React from 'react';
import Link, { LinkProps } from 'next/link';

interface LinkButtonProps extends LinkProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  className?: string;
  target?: string;
  rel?: string;
}

export function LinkButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: LinkButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md transition-colors';

  const variants = {
    primary: 'bg-accent-500 text-white px-6 py-2.5 hover:bg-accent-600 transition-colors',
    secondary: 'bg-bg-200 text-text-900 border border-bg-300 px-6 py-2.5 hover:bg-bg-300 transition-colors',
    tertiary: 'bg-bg-100 text-text-900 border border-bg-400 px-6 py-2 hover:bg-bg-200 transition-colors',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2.5 hover:bg-red-500/20 transition-colors'
  };

  return (
    <Link
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
