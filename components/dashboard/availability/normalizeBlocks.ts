import { TimeBlock } from './types';

export const normalizeBlocks = (blocks: TimeBlock[], activeBlockId: string): TimeBlock[] => {
  const active = blocks.find(b => b.id === activeBlockId);
  if (!active) return blocks;

  let otherBlocks = blocks.filter(b => b.id !== activeBlockId && b.dayIndex === active.dayIndex);
  const unaffectedBlocks = blocks.filter(b => b.dayIndex !== active.dayIndex);

  // 1. Resolve overlaps with the active block (active block overwrites others)
  let resolvedOtherBlocks: TimeBlock[] = [];
  for (const other of otherBlocks) {
    if (other.startHour < active.endHour && other.endHour > active.startHour) {
      if (other.startHour >= active.startHour && other.endHour <= active.endHour) {
        // Active completely covers other -> remove other
        continue;
      } else if (other.startHour < active.startHour && other.endHour > active.endHour) {
        // Other completely covers active -> split other
        resolvedOtherBlocks.push({ ...other, id: `split-${Date.now()}-1`, endHour: active.startHour });
        resolvedOtherBlocks.push({ ...other, id: `split-${Date.now()}-2`, startHour: active.endHour });
      } else if (other.startHour < active.startHour) {
        // Other overlaps at the start
        resolvedOtherBlocks.push({ ...other, endHour: active.startHour });
      } else {
        // Other overlaps at the end
        resolvedOtherBlocks.push({ ...other, startHour: active.endHour });
      }
    } else {
      resolvedOtherBlocks.push(other);
    }
  }

  // 2. Merge adjacent/overlapping blocks of the same status
  let dayBlocks = [active, ...resolvedOtherBlocks].sort((a, b) => a.startHour - b.startHour);
  let mergedDayBlocks: TimeBlock[] = [];

  for (const curr of dayBlocks) {
    if (mergedDayBlocks.length === 0) {
      mergedDayBlocks.push(curr);
      continue;
    }
    const prev = mergedDayBlocks[mergedDayBlocks.length - 1];
    
    // Check if they touch or overlap AND have the same status
    if (curr.startHour <= prev.endHour && curr.status === prev.status) {
      if (curr.id === activeBlockId) {
        // Preserve active block ID
        curr.startHour = Math.min(curr.startHour, prev.startHour);
        curr.endHour = Math.max(curr.endHour, prev.endHour);
        mergedDayBlocks[mergedDayBlocks.length - 1] = curr;
      } else {
        // Prev (which could be active) absorbs curr
        prev.endHour = Math.max(prev.endHour, curr.endHour);
      }
    } else {
      mergedDayBlocks.push(curr);
    }
  }

  // Remove blocks that have 0 duration
  mergedDayBlocks = mergedDayBlocks.filter(b => b.endHour > b.startHour);

  return [...unaffectedBlocks, ...mergedDayBlocks];
};
