'use client';
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isPassword?: boolean;
}

export function Input({ 
  label, 
  isPassword = false, 
  className = '', 
  ...props 
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type || 'text';

  return (
    <div className="flex flex-col w-full gap-1">
      {label && (
        <label className="text-[13px] font-normal text-dashboard-text-s2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input 
          type={inputType}
          className={`w-full bg-dashboard-bg-s2 text-dashboard-text border border-dashboard-stroke rounded-md px-3 py-2 text-sm focus:outline-none focus:border-dashboard-text focus:shadow-[0_0_0_3px_rgba(114,176,29,0.15)] transition-all ${className}`}
          {...props}
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? (
              // Eye Icon (Visible)
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              // Eye Off Icon (Hidden)
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
