import React from 'react';

export function NumberInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      type="number"
      className={`bg-dashboard-bg-s3 border border-dashboard-stroke rounded p-1.5 text-center text-dashboard-text outline-none focus:border-dashboard-primary transition-colors ${className}`}
      {...props}
    />
  );
}
