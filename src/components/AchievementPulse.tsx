import { format, subDays, isSameDay } from 'date-fns';
import { motion } from 'motion/react';
import { Achievement } from '../lib/firebase';

interface PulseProps {
  achievements: Achievement[];
}

export default function AchievementPulse({ achievements }: PulseProps) {
  const last21Days = Array.from({ length: 21 }).map((_, i) => subDays(new Date(), 20 - i));

  const getFreqColor = (count: number) => {
    if (count === 0) return 'bg-neutral-100';
    if (count === 1) return 'bg-sky-200';
    if (count < 4) return 'bg-blue-400';
    if (count < 8) return 'bg-emerald-400';
    if (count < 15) return 'bg-amber-400';
    return 'bg-violet-500';
  };

  return (
    <div className="flex flex-col items-end gap-2" id="pulse-wrapper">
      <div className="flex items-center gap-1" id="pulse-dots">
        {last21Days.map((day, i) => {
          const count = achievements.filter((a) => a.timestamp && isSameDay(a.timestamp.toDate(), day)).length;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`w-0.5 h-3 rounded-full transition-all duration-700 ${getFreqColor(count)} ${
                count > 0 ? 'hover:h-4' : ''
              }`}
            />
          );
        })}
      </div>
      <span className="text-[7px] font-mono lowercase tracking-[0.2em] text-neutral-400">activity pulse</span>
    </div>
  );
}
