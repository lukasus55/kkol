import React from 'react';

export function NumberInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      className={`bg-bg-300 border border-bg-400 rounded p-1.5 text-center text-text-900 outline-none focus:border-accent-500 transition-colors ${className}`}
      {...props}
    />
  );
}
