// src/components/DashboardStats.tsx
import { Achievement } from '../lib/firebase';
import { isSameDay, subDays, differenceInDays } from 'date-fns';

interface StatsProps {
  achievements: Achievement[];
}

export default function DashboardStats({ achievements }: StatsProps) {
  const types = ['work', 'growth', 'personal', 'other'] as const;
  const distribution = types.map(type => ({
    type,
    count: achievements.filter(a => a.type === type).length
  }));

  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  // Calculate Streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const day = subDays(today, i);
    const hasUnits = achievements.some(a => a.timestamp && isSameDay(a.timestamp.toDate(), day));
    if (hasUnits) streak++;
    else if (i > 0) break; // Allow today to be empty if streak isn't broken yet
  }

  // Calculate Velocity (Last 7 days vs rolling average)
  const last7DaysCount = achievements.filter(a => {
    if (!a.timestamp) return false;
    const diff = differenceInDays(new Date(), a.timestamp.toDate());
    return diff < 7;
  }).length;
  const velocity = (last7DaysCount / 7).toFixed(1);

  return (
    <div className="pt-4 border-t-2 border-neutral-100 mt-8" id="dashboard-stats">
      <div className="flex items-center justify-between mb-4 px-0.5">
        <span className="text-[7.5px] font-mono text-neutral-300 uppercase tracking-[0.2em] font-medium">momentum_matrix</span>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[6.5px] font-mono text-neutral-200 uppercase tracking-tighter">streak</span>
            <span className="text-[11px] font-sans font-semibold text-black leading-none">{streak}d</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[6.5px] font-mono text-neutral-200 uppercase tracking-tighter">velocity</span>
            <span className="text-[11px] font-sans font-semibold text-black leading-none">{velocity}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-0.5">
        {distribution.map(d => (
          <div key={d.type} className="flex flex-col gap-2">
            <div className="h-[2px] bg-neutral-50 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  d.type === 'work' ? 'bg-black' : 
                  d.type === 'growth' ? 'bg-neutral-600' : 
                  d.type === 'personal' ? 'bg-neutral-400' : 'bg-neutral-200'
                }`}
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[7.5px] font-mono text-neutral-400 lowercase tracking-tighter leading-none">{d.type}</span>
              <span className="text-[9.5px] font-mono text-black font-semibold leading-none">{d.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
