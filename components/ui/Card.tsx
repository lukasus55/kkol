import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-dashboard-bg-s3 border border-dashboard-stroke rounded-md p-6 w-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <h3 
      className={`text-base text-dashboard-text-s2 font-normal mb-4 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}
