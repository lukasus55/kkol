'use client';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  labelClassName = '',
  isPassword = false,
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type || 'text';

  return (
    <div className="flex flex-col w-full gap-1">
      {label && (
        <label className={`text-[13px] font-normal text-text-700 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          {...props}
          type={inputType}
          className={`w-full bg-bg-200 text-text-900 border border-bg-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-text-900 focus:shadow-[0_0_0_3px_rgba(114,176,29,0.15)] transition-all ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-900 transition-colors"
          >
            {showPassword ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
