'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { Search } from 'lucide-react';

interface PlayerSearchBarProps {
  onSelect: (playerId: string) => void;
  placeholder?: string;
}

export function PlayerSearchBar({ onSelect, placeholder = "Wyszukaj gracza..." }: PlayerSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search_players?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (playerId: string) => {
    onSelect(playerId);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-700 pointer-events-none" />
        <Input
          className="pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 w-full mt-2 bg-bg-100 border border-bg-400 rounded-md shadow-xl overflow-hidden z-[150]">
          {loading ? (
            <div className="p-4 text-center text-sm text-text-700">Szukanie...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-700">Brak wyników.</div>
          ) : (
            results.map((player) => (
              <button
                key={player.id}
                onClick={() => handleSelect(player.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-bg-200 transition-colors text-left border-b border-bg-400 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-bg-100 border border-bg-400 overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={player.pfp_base64 ? (player.pfp_base64.startsWith('data:image') ? player.pfp_base64 : `data:image/jpeg;base64,${player.pfp_base64}`) : '/img/default_pfp.webp'}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-900">{player.displayed_name}</span>
                  <span className="text-[10px] text-text-700">@{player.id}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
