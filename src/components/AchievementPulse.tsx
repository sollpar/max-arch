import { format, subDays, isSameDay } from 'date-fns';
import { motion } from 'motion/react';
import { Achievement } from '../lib/firebase';

interface PulseProps {
  achievements: Achievement[];
}

export default function AchievementPulse({ achievements }: PulseProps) {
  const last30Days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), 29 - i));

  const getFreqClass = (count: number) => {
    if (count === 0) return 'bg-neutral-100';
    if (count < 2) return 'bg-neutral-300';
    if (count < 4) return 'bg-neutral-500';
    if (count < 7) return 'bg-neutral-800';
    return 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.2)]';
  };

  return (
    <div className="flex flex-col items-end gap-1.5" id="pulse-wrapper">
      <div className="grid grid-cols-10 gap-[1px]" id="pulse-grid">
        {last30Days.map((day, i) => {
          const count = achievements.filter((a) => a.timestamp && isSameDay(a.timestamp.toDate(), day)).length;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`w-[6px] h-[6px] rounded-[1px] transition-all duration-500 ${getFreqClass(count)}`}
              title={`${format(day, 'MMM dd')}: ${count} units`}
            />
          );
        })}
      </div>
      <span className="text-[6px] font-mono lowercase tracking-[0.2em] text-neutral-300">momentum_matrix</span>
    </div>
  );
}
