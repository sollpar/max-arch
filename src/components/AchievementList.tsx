import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Achievement, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { X, Trash2, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ListProps {
  achievements: Achievement[];
}

export default function AchievementList({ achievements }: ListProps) {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const isOwner = user?.email === 'maximion96@gmail.com';

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'achievements', id));
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `achievements/${id}`);
    }
  };

  if (achievements.length === 0) {
    return (
      <div className="py-20 text-center" id="empty-state">
        <p className="text-neutral-200 font-mono lowercase tracking-[0.2em] text-[8px]">awaiting record</p>
      </div>
    );
  }

  // Group by date
  const grouped = achievements.reduce((acc, curr) => {
    if (!curr.timestamp) return acc;
    const date = format(curr.timestamp.toDate(), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work': return 'text-cat-work';
      case 'growth': return 'text-cat-growth';
      case 'personal': return 'text-cat-personal';
      default: return 'text-neutral-300';
    }
  };

  return (
    <div className="space-y-4" id="achievement-timeline">
      <AnimatePresence mode="popLayout">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="relative">
            <h2 className="text-[7px] font-mono lowercase tracking-tight text-neutral-400 mb-1 border-b border-neutral-50 pb-0.5 w-full flex justify-between items-center">
              <span>{format(new Date(date), 'MMM dd, yyyy')}</span>
              <span className="opacity-10">{items.length} units</span>
            </h2>
            <div className="space-y-0.5">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group flex items-start gap-4"
                >
                  <span className="text-[7px] font-mono text-neutral-300 tracking-tight group-hover:text-black transition-colors cursor-default lowercase w-7 shrink-0 pt-1">
                    {item.timestamp ? format(item.timestamp.toDate(), 'HH:mm') : '--:--'}
                  </span>
                  
                  <div className="flex-1 flex items-start justify-between gap-3 py-0.5 min-h-[1.5rem]">
                    {confirmDelete === item.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[7px] font-mono text-axiom-warning lowercase italic shrink-0 tracking-tighter">confirm deletion?</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => item.id && handleDelete(item.id)}
                            className="text-[7px] font-mono text-axiom-warning hover:bg-axiom-warning hover:text-white px-1 transition-colors lowercase border border-axiom-warning/10"
                          >
                            yes
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(null)}
                            className="text-[7px] font-mono text-neutral-400 hover:text-black px-1 transition-colors lowercase border border-neutral-100"
                          >
                            no
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[9.5px] font-sans font-medium leading-tight tracking-tight text-black transition-colors max-w-[210px] break-words">
                          {item.text}
                        </p>
                        
                        <div className="flex items-center gap-2 shrink-0 pt-1">
                          <span className={`text-[5.5px] font-mono lowercase tracking-[0.2em] group-hover:opacity-100 opacity-60 transition-colors uppercase ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                          {isOwner && (
                            <button 
                              onClick={() => setConfirmDelete(item.id || null)}
                              className="text-neutral-200 hover:text-axiom-warning transition-all cursor-pointer opacity-0 group-hover:opacity-100 p-1 -m-1"
                              title="delete"
                            >
                              <X size={6} strokeWidth={1} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
