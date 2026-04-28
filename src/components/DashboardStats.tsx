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
    <div className="pt-3 border-t border-neutral-100 mt-6" id="dashboard-stats">
      <div className="flex items-center justify-between mb-4 px-0.5">
        <span className="text-[8.5px] font-mono text-neutral-300 uppercase tracking-[0.2em] font-medium">momentum_matrix</span>
      </div>

      <div className="grid grid-cols-4 gap-4 px-0.5">
        {distribution.map(d => (
          <div key={d.type} className="flex flex-col gap-2">
            <div className="h-[1.5px] bg-neutral-50 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  d.type === 'work' ? 'bg-cat-work' : 
                  d.type === 'growth' ? 'bg-cat-growth' : 
                  d.type === 'personal' ? 'bg-cat-personal' : 'bg-cat-other'
                }`}
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[8.5px] font-mono text-neutral-400 lowercase tracking-tighter leading-none">{d.type}</span>
              <span className="text-[11px] font-mono text-black font-semibold leading-none">{d.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
