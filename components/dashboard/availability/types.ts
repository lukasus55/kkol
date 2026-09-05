export interface TimeBlock {
  id: string; // temporary or db id
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  startHour: number; // e.g. 14.5 for 14:30
  endHour: number;   // e.g. 16.0 for 16:00
  status: 'available' | 'maybe' | 'unavailable';
  isOverride?: boolean;
}

export interface WeeklyTimeGridProps {
  mode: 'routine' | 'specific_week';
  weekStartDate: Date | null; // Monday of the current week
  initialBlocks: TimeBlock[];
  onSaveRoutine?: (blocks: TimeBlock[]) => void;
  onSaveDayOverride?: (dateStr: string, blocks: TimeBlock[], revertToRoutine: boolean) => void;
  hasOverridesMap?: Record<number, boolean>;
  isLoading?: boolean;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  readOnly?: boolean;
}

export const DAYS_SHORT = ["Pon", "Wto", "Śro", "Czw", "Pią", "Sob", "Nie"];

export const STATUS_COLORS: Record<string, string> = {
  'available': 'bg-green-500 text-green-900',
  'maybe': 'bg-yellow-500 text-yellow-900'
};

export const formatHour = (hourObj: number) => {
  const h = Math.floor(hourObj);
  const m = (hourObj % 1) * 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
