'use client';

import React, { useState } from 'react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { ClipboardCheck, ClipboardX, Shield, UserMinus, ArrowUp, ArrowDown } from 'lucide-react';
import { PlayerSearchBar } from '../../ui/PlayerSearchBar';
import { Tooltip } from '../../ui/Tooltip';
import { NumberInput } from '../../ui/NumberInput';

interface PlayersProps {
  players: any[];
  setPlayers: (newPlayers: any[]) => void;
  isOwner: boolean;
  currentUserId: string | null;
  onKick: (playerId: string) => void;
  onRoleChange: (playerId: string, currentRole: string) => void;
  onAttendanceChange: (playerId: string) => void;
  onAddPlayer: (playerId: string) => void;
}

export function TournamentPlayersTab({ players, setPlayers, isOwner, currentUserId, onKick, onRoleChange, onAttendanceChange, onAddPlayer }: PlayersProps) {
  const handleUpdatePlayer = (index: number, field: string, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">

      <div className="flex items-center gap-3">
        <PlayerSearchBar onSelect={onAddPlayer} />
      </div>

      <div className="border border-dashboard-stroke rounded-md bg-dashboard-bg overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-dashboard-bg-s3 border-b border-dashboard-stroke text-dashboard-text-s2">
            <tr>
              <th className="p-3 font-semibold w-full">Gracz</th>
              <th className="p-3 font-semibold text-center w-24">Miejsce</th>
              <th className="p-3 font-semibold text-center w-24">Punkty</th>
              <th className="p-3 font-semibold text-right w-44">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-stroke">
            {players.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-dashboard-text-s2">Brak graczy w tym turnieju.</td>
              </tr>
            ) : (
              players.map((p, idx) => (
                <tr key={p.id} className="hover:bg-dashboard-bg-s2 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dashboard-text">{p.displayed_name}</span>
                      <span className="text-dashboard-text-s2 text-xs">({p.id})</span>
                      {p.organizer_role === 'manager' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase">Manager</span>
                      )}
                      {p.organizer_role === 'owner' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 uppercase">Owner</span>
                      )}
                      {!p.attended && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 uppercase">Nieobecny</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <NumberInput
                      className="w-full"
                      value={p.position !== null ? p.position : ''}
                      onChange={(e) => handleUpdatePlayer(idx, 'position', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <NumberInput
                      step="0.1"
                      className="w-full"
                      value={p.total_points !== null ? p.total_points : ''}
                      onChange={(e) => handleUpdatePlayer(idx, 'total_points', e.target.value)}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      
                      <div className="w-8 flex justify-center">
                        <Tooltip content={p.attended ? "Oznacz jako nieobecnego" : "Oznacz jako obecnego"}>
                          <button 
                            onClick={() => onAttendanceChange(p.id)}
                            className={`p-1.5 rounded transition-colors ${p.attended ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                          >
                            {p.attended ? <ClipboardX className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                          </button>
                        </Tooltip>
                      </div>

                      <div className="w-8 flex justify-center">
                        {isOwner && p.organizer_role !== 'owner' && (
                          <Tooltip content={p.organizer_role === 'manager' ? "Zdegraduj managera" : "Awansuj na managera"}>
                            <button 
                              onClick={() => onRoleChange(p.id, p.organizer_role)}
                              className="p-1.5 rounded transition-colors hover:bg-dashboard-bg-s3"
                            >
                              {p.organizer_role === 'manager' ? (
                                <div className="relative text-orange-400">
                                  <Shield className="w-5 h-5" />
                                  <ArrowDown className="w-3 h-3 absolute -bottom-1 -right-1 text-orange-300 bg-dashboard-bg rounded-full" strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="relative text-blue-400">
                                  <Shield className="w-5 h-5" />
                                  <ArrowUp className="w-3 h-3 absolute -bottom-1 -right-1 text-blue-300 bg-dashboard-bg rounded-full" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          </Tooltip>
                        )}
                      </div>

                      <div className="w-8 flex justify-center">
                        {(isOwner || (p.organizer_role !== 'owner' && p.organizer_role !== 'manager')) && p.id !== currentUserId && (
                          <Tooltip content="Wyrzuć gracza z turnieju">
                            <button 
                              onClick={() => onKick(p.id)}
                              className="p-1.5 rounded transition-colors text-red-500 hover:bg-red-500/10"
                            >
                              <UserMinus className="w-5 h-5" />
                            </button>
                          </Tooltip>
                        )}
                      </div>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
