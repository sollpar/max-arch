import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { addDoc, collection, db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface CreateEntryProps {
  userId: string;
}

export default function CreateEntry({ userId }: CreateEntryProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<'work' | 'personal' | 'growth' | 'other' | 'thought'>('work');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'achievements'), {
        text: text.trim(),
        type,
        userId,
        timestamp: serverTimestamp(),
      });
      setText('');
      setIsExpanded(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'achievements');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (t: string) => {
    if (type !== t) return 'text-neutral-300 hover:text-neutral-500';
    switch (t) {
      case 'work': return 'text-cat-work font-bold';
      case 'growth': return 'text-cat-growth font-bold';
      case 'personal': return 'text-cat-personal font-bold';
      case 'thought': return 'text-cat-thought font-bold';
      default: return 'text-black font-bold';
    }
  };

  return (
    <div className="mb-4" id="create-entry-container">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-3 text-neutral-300 hover:text-black transition-colors duration-500 py-1"
          id="expand-btn"
        >
          <Plus size={10} strokeWidth={1.5} />
          <span className="text-[10px] font-mono tracking-tight lowercase font-medium italic opacity-60 group-hover:opacity-100">add increment / thought</span>
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-2 border-l border-neutral-100 pl-4 py-0.5"
        >
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={type === 'thought' ? "share a thought..." : "commit unit..."}
            className={`w-full bg-transparent border-none outline-none py-0.5 leading-tight tracking-tight transition-all placeholder:text-neutral-100 resize-none text-black focus:text-black ${type === 'thought' ? 'font-sans text-[9px] italic text-neutral-400 font-medium' : 'font-sans text-[11.5px] font-medium'}`}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex flex-col gap-2 pt-1.5 border-t border-neutral-100/50">
            <div className="flex gap-4">
              {(['work', 'personal', 'growth', 'thought', 'other'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`text-[9px] font-mono lowercase tracking-tight transition-all ${
                    type === t 
                      ? t === 'work' ? 'text-cat-work font-bold' 
                         : t === 'growth' ? 'text-cat-growth font-bold'
                        : t === 'personal' ? 'text-cat-personal font-bold'
                        : t === 'thought' ? 'text-cat-thought font-bold'
                        : 'text-neutral-600 font-bold'
                      : 'text-neutral-300 hover:text-neutral-500'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className="text-[9px] font-mono lowercase tracking-[0.2em] text-neutral-400 hover:text-black disabled:opacity-10 transition-colors flex items-center gap-1.5"
              >
                <div className="w-[1px] h-3 bg-neutral-200 group-hover:bg-black transition-colors" />
                {isSubmitting ? 'syncing...' : type === 'thought' ? 'sync_thought' : 'commit_unit'}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-[9px] font-mono lowercase tracking-[0.2em] text-neutral-200 hover:text-black transition-colors underline decoration-dotted"
                id="abort-btn"
              >
                abort
              </button>
            </div>
          </div>
        </motion.form>
      )}
    </div>
  );
}
