import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { addDoc, collection, db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface CreateEntryProps {
  userId: string;
}

export default function CreateEntry({ userId }: CreateEntryProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<'work' | 'personal' | 'growth' | 'other'>('work');
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
      default: return 'text-black font-bold';
    }
  };

  return (
    <div className="mb-4" id="create-entry-container">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 text-neutral-300 hover:text-black transition-colors duration-500"
          id="expand-btn"
        >
          <Plus size={8} strokeWidth={1} />
          <span className="text-[8.5px] font-mono tracking-tight lowercase font-light italic opacity-60 group-hover:opacity-100">add increment</span>
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-2 border-l border-neutral-100 pl-4 py-1"
        >
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="commit unit..."
            className="w-full bg-transparent border-none outline-none py-0.5 text-[10px] font-sans font-medium leading-tight tracking-tight transition-colors placeholder:text-neutral-100 resize-none text-black focus:text-black"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100">
            <div className="flex gap-4">
              {(['work', 'personal', 'growth', 'other'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`text-[6.5px] font-mono lowercase tracking-[0.2em] transition-all hover:text-black ${type === t ? 'text-black font-bold' : 'text-neutral-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className="text-[7.5px] font-mono lowercase tracking-[0.3em] text-neutral-400 hover:text-black disabled:opacity-10 transition-colors flex items-center gap-1"
              >
                <div className="w-1 h-2.5 bg-neutral-100 group-hover:bg-black transition-colors" />
                {isSubmitting ? 'syncing_data' : 'commit_unit'}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-[7.5px] font-mono lowercase tracking-[0.3em] text-neutral-200 hover:text-black transition-colors"
                id="abort-btn"
              >
                abort_sequence
              </button>
            </div>
          </div>
        </motion.form>
      )}
    </div>
  );
}
