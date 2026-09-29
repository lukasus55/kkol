'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, ChevronDown } from 'lucide-react';

interface NavAdminSectionProps {
  pathname: string;
  onNavigate?: () => void;
}

export function NavAdminSection({ pathname, onNavigate }: NavAdminSectionProps) {
  const [isExpanded, setIsExpanded] = useState(pathname.startsWith('/dashboard/admin'));
  const isActiveParent = pathname.startsWith('/dashboard/admin');

  return (
    <li className="group relative flex flex-col w-full pt-2 mt-1 border-t border-bg-300">
      <div
        className={`flex items-center justify-between w-full h-9 rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${
          isActiveParent && !isExpanded ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 text-sm">
          <Shield className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Panel administratora</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="flex flex-col w-full mt-1">
          <div className="flex flex-col border-l border-bg-400 ml-[20px] pl-[10px] gap-1 py-1">
            <Link
              href="/dashboard/admin/users"
              onClick={onNavigate}
              className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${
                pathname.startsWith('/dashboard/admin/users')
                  ? 'font-semibold text-text-900 bg-bg-300'
                  : 'text-text-700'
              }`}
            >
              <span>Użytkownicy</span>
            </Link>
            <Link
              href="/dashboard/admin/trivia"
              onClick={onNavigate}
              className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${
                pathname.startsWith('/dashboard/admin/trivia')
                  ? 'font-semibold text-text-900 bg-bg-300'
                  : 'text-text-700'
              }`}
            >
              <span>Ciekawostki</span>
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}
