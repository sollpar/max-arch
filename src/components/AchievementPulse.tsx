import { format, subDays, isSameDay } from 'date-fns';
import { motion } from 'motion/react';
import { Achievement } from '../lib/firebase';

interface PulseProps {
  achievements: Achievement[];
}

export default function AchievementPulse({ achievements }: PulseProps) {
  const last21Days = Array.from({ length: 21 }).map((_, i) => subDays(new Date(), 20 - i));

  return (
    <div className="flex flex-col items-end gap-2" id="pulse-wrapper">
      <div className="flex items-center gap-1" id="pulse-dots">
        {last21Days.map((day, i) => {
          const hasPosts = achievements.some((a) => a.timestamp && isSameDay(a.timestamp.toDate(), day));
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`w-0.5 h-3 rounded-full transition-all duration-700 ${
                hasPosts ? 'bg-axiom-pulse hover:h-4' : 'bg-neutral-100'
              }`}
            />
          );
        })}
      </div>
      <span className="text-[7px] font-mono lowercase tracking-[0.2em] text-neutral-400">activity pulse</span>
    </div>
  );
}
