'use client';
import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { DAYS_SHORT, FULL_DAY_NAMES, formatHour } from './types';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dayIndex: number, startHour: number, endHour: number, status: 'available' | 'maybe') => void;
  mode: 'routine' | 'specific_week';
  weekStartDate: Date | null;
  initialDayIndex?: number;
  initialStartHour?: number;
  initialEndHour?: number;
}

export const AddBlockModal: React.FC<AddBlockModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  mode,
  weekStartDate,
  initialDayIndex = 0,
  initialStartHour = 16,
  initialEndHour = 18
}) => {
  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [startTime, setStartTime] = useState(formatHour(initialStartHour));
  const [endTime, setEndTime] = useState(formatHour(initialEndHour));
  const [status, setStatus] = useState<'available' | 'maybe'>('available');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDayIndex(initialDayIndex);
      setStartTime(formatHour(initialStartHour));
      setEndTime(formatHour(initialEndHour));
      setStatus('available');
      setError(null);
    }
  }, [isOpen, initialDayIndex, initialStartHour, initialEndHour]);

  const dayOptions = FULL_DAY_NAMES.map((name, i) => {
    let label = name;
    if (mode === 'specific_week' && weekStartDate) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      label = `${name} (${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month})`;
    }
    return { value: String(i), label };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startHourNum = startH + (startM / 60);
    const endHourNum = endH + (endM / 60);

    if (endHourNum <= startHourNum) {
      setError('Godzina zakończenia musi być późniejsza niż rozpoczęcia.');
      return;
    }

    onAdd(dayIndex, startHourNum, endHourNum, status);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dodaj dostępność"
      maxWidth="max-w-md"
      height="h-auto"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Dodaj dostępność
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-text-700 mb-1.5">Dzień</label>
          <Select
            value={String(dayIndex)}
            onChange={(val) => setDayIndex(Number(val))}
            options={dayOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Od"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div>
            <Input
              label="Do"
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setError(null);
              }}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-semibold">{error}</p>
        )}

        <div>
          <label className="block text-xs font-bold text-text-700 mb-1.5">Status</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('available')}
              className={`flex-1 py-2.5 px-3 rounded-md text-xs font-bold transition-all border ${
                status === 'available'
                  ? 'bg-green-500 text-green-950 border-green-600 shadow-sm'
                  : 'bg-bg-200 text-text-600 border-bg-400 hover:bg-green-500/20 hover:text-green-700'
              }`}
            >
              Dostępny
            </button>
            <button
              type="button"
              onClick={() => setStatus('maybe')}
              className={`flex-1 py-2.5 px-3 rounded-md text-xs font-bold transition-all border ${
                status === 'maybe'
                  ? 'bg-yellow-500 text-yellow-950 border-yellow-600 shadow-sm'
                  : 'bg-bg-200 text-text-600 border-bg-400 hover:bg-yellow-500/20 hover:text-yellow-700'
              }`}
            >
              Być może
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
