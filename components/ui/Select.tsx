import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string, label: string }[];
  disabled?: boolean;
  className?: string;
}

export function Select({ value, onChange, options, disabled, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`bg-bg-300 border ${isOpen ? 'border-accent-500' : 'border-bg-400'} rounded p-2 flex items-center justify-between transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-500/50'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="text-text-900 text-sm truncate">
          {selectedOption ? selectedOption.label : 'Wybierz...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-400 border border-bg-400 rounded shadow-xl z-[100] max-h-60 overflow-y-auto custom-scrollbar">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-text-700 text-center">Brak opcji</div>
          ) : (
            options.map(opt => (
              <div
                key={opt.value}
                className={`p-2.5 text-sm cursor-pointer transition-colors ${opt.value === value ? 'bg-accent-500/20 text-accent-500 font-medium' : 'text-text-900 hover:bg-bg-300'}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
