import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Achievement, db, handleFirestoreError, OperationType, updateDoc } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { X, Edit3, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ListProps {
  achievements: Achievement[];
}

export default function AchievementList({ achievements }: ListProps) {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState<Achievement['type']>('work');
  const [isUpdating, setIsUpdating] = useState(false);
  const isOwner = user?.email === 'maximion96@gmail.com';

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'achievements', id));
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `achievements/${id}`);
    }
  };

  const startEdit = (item: Achievement) => {
    if (!item.id) return;
    setEditingId(item.id);
    setEditValue(item.text);
    setEditType(item.type);
  };

  const handleUpdate = async (e?: React.FormEvent, id?: string) => {
    if (e) e.preventDefault();
    const docId = id || editingId;
    if (!docId || !editValue.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'achievements', docId), {
        text: editValue.trim(),
        type: editType
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `achievements/${docId}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (achievements.length === 0) {
    return (
      <div className="py-24 text-center" id="empty-state">
        <p className="text-neutral-200 font-mono lowercase tracking-[0.2em] text-[10px]">awaiting record</p>
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
      case 'work': return 'text-cat-work bg-cat-work/5 border-cat-work/10';
      case 'growth': return 'text-cat-growth bg-cat-growth/5 border-cat-growth/10';
      case 'personal': return 'text-cat-personal bg-cat-personal/5 border-cat-personal/10';
      default: return 'text-cat-other bg-cat-other/5 border-cat-other/10';
    }
  };

  return (
    <div className="space-y-12" id="achievement-timeline">
      <AnimatePresence mode="popLayout">
        {Object.entries(grouped).map(([date, items], groupIndex) => (
          <motion.div 
            key={date} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="group/day"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 py-2.5 mb-4 border-b border-neutral-100 flex items-baseline justify-between px-0.5">
              <h2 className="text-[10.5px] font-mono lowercase tracking-[0.05em] text-black font-semibold">
                {format(new Date(date), 'MMM dd, yyyy')}
              </h2>
              <span className="text-[8.5px] font-mono text-neutral-300 uppercase tracking-[0.2em] font-normal">{items.length} units</span>
            </div>
            
            <div className="space-y-4">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (groupIndex * 0.05) + (i * 0.02) }}
                  className="group flex flex-col gap-1.5 px-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2.5 w-14 shrink-0 py-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="w-[2px] h-3.5 bg-black" />
                      <span className="text-[10px] font-mono text-black font-bold tracking-tighter">
                        {item.timestamp ? format(item.timestamp.toDate(), 'HH:mm') : '--:--'}
                      </span>
                    </div>
                  
                  <div className="flex-1 flex flex-col gap-2 min-h-[1.5rem]">
                    {editingId === item.id ? (
                      <form onSubmit={handleUpdate} className="flex-1 flex flex-col gap-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full text-[13px] font-sans font-medium leading-relaxed tracking-tight text-black bg-neutral-50/50 p-2.5 border-l-2 border-black focus:ring-0 resize-none min-h-[4rem]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) handleUpdate(e);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {(['work', 'growth', 'personal', 'other'] as const).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setEditType(t)}
                                className={`text-[9px] font-mono lowercase tracking-widest px-2 py-0.5 border ${editType === t ? 'bg-black text-white border-black' : 'text-neutral-300 border-neutral-100 hover:border-neutral-200'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-4">
                            <button 
                              type="submit"
                              disabled={isUpdating}
                              className={`text-black transition-colors ${isUpdating ? 'opacity-20' : 'hover:text-black'}`}
                            >
                              <Check size={14} strokeWidth={2.5} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-neutral-300 hover:text-black transition-colors"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : confirmDelete === item.id ? (
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-axiom-warning lowercase italic shrink-0 tracking-tighter">confirm_deletion?</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => item.id && handleDelete(item.id)}
                            className="text-[9.5px] font-mono text-axiom-warning hover:bg-axiom-warning hover:text-white px-2 transition-colors lowercase border border-axiom-warning/10"
                          >
                            yes
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(null)}
                            className="text-[9.5px] font-mono text-neutral-400 hover:text-black px-2 transition-colors lowercase border border-neutral-100"
                          >
                            no
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
                          <p className="text-[13px] font-sans font-semibold leading-relaxed tracking-tight text-black flex-1">
                            {item.text}
                          </p>
                          <span className={`text-[8px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-[4px] border font-bold shrink-0 transition-opacity ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                        </div>
                        
                        {isOwner && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-2 pt-1">
                            <button 
                              onClick={() => startEdit(item)}
                              className="text-neutral-300 hover:text-black transition-all cursor-pointer p-0.5"
                              title="edit"
                            >
                              <Edit3 size={11} strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={() => setConfirmDelete(item.id || null)}
                              className="text-neutral-300 hover:text-axiom-warning transition-all cursor-pointer p-0.5"
                              title="delete"
                            >
                              <X size={11} strokeWidth={1.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
