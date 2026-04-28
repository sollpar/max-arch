import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Achievement, collection, db, onSnapshot, orderBy, query, limit, startAfter, where, getDocs, Timestamp, handleFirestoreError, OperationType } from './lib/firebase';
import AchievementPulse from './components/AchievementPulse';
import CreateEntry from './components/CreateEntry';
import AchievementList from './components/AchievementList';
import DashboardStats from './components/DashboardStats';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const PAGE_SIZE = 200;

export default function App() {
  const { user, loading: authLoading, signIn, logOut } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<Achievement['type'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [recentCount, setRecentCount] = useState(0);

  // Pulse logic based on activity in last 7 days
  useEffect(() => {
    try {
      const sevenDaysAgo = new Timestamp(Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), 0);
      const q = query(collection(db, 'achievements'), where('timestamp', '>=', sevenDaysAgo));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRecentCount(snapshot.size);
      }, (error) => {
        console.warn("Pulse logic error (might need index):", error);
        // We don't call handleFirestoreError here to avoid crashing the whole app for a minor feature
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Pulse setup failed:", e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'achievements'),
      orderBy('timestamp', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Achievement[];
      setAchievements(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'achievements');
    });

    return () => unsubscribe();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || !hasMore) return;
    
    try {
      const nextQ = query(
        collection(db, 'achievements'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(nextQ);
      const newItems = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Achievement));
      
      setAchievements(prev => [...prev, ...newItems]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading more:", error);
    }
  };

  const getPulseColor = () => {
    if (recentCount === 0) return 'bg-neutral-100';
    if (recentCount < 3) return 'bg-sky-200';
    if (recentCount < 7) return 'bg-blue-400';
    if (recentCount < 15) return 'bg-emerald-400';
    if (recentCount < 30) return 'bg-amber-400';
    return 'bg-violet-500';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-axiom-bg text-axiom-pulse">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[10px] font-mono uppercase tracking-[0.4em]"
        >
          Initializing
        </motion.div>
      </div>
    );
  }

  const filteredAchievements = achievements.filter(a => filter === 'all' || a.type === filter);

  return (
    <div className="min-h-screen max-w-sm mx-auto px-8 py-12 selection:bg-black selection:text-white">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full animate-pulse transition-colors duration-1000 ${getPulseColor()}`} />
            <h1 className="text-[11px] font-mono font-normal tracking-[0.1em] lowercase opacity-40">
              max / archive
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <AchievementPulse achievements={achievements} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-neutral-400 font-mono leading-relaxed lowercase max-w-[240px] font-light">
            a record of units committed to the timeline.
          </p>
          
          <div className="flex items-center gap-4 pt-1.5 border-t border-neutral-100">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-[8.5px] font-mono text-neutral-300 lowercase tracking-widest">
                  root: {user.email?.split('@')[0]}
                </span>
                <button 
                  onClick={logOut}
                  className="text-neutral-300 hover:text-axiom-warning transition-colors"
                >
                  <LogOut size={10} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="text-[8.5px] font-mono text-neutral-300 hover:text-black transition-all"
              >
                authorize / entry
              </button>
            )}
          </div>
          
          <DashboardStats achievements={achievements} />
        </div>

        <div className="flex gap-5 pt-1.5 border-b border-neutral-50/50 pb-2">
          {(['all', 'work', 'growth', 'personal', 'other'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-[7.5px] font-mono lowercase tracking-tighter transition-all ${
                filter === t ? 'text-black font-semibold' : 'text-neutral-300 hover:text-neutral-500'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-4">
        {user && user.email === 'maximion96@gmail.com' && (
          <CreateEntry userId={user.uid} />
        )}

        {loading ? (
          <div className="py-12 text-neutral-200 font-mono tracking-[0.3em] text-[8.5px] lowercase">
            syncing...
          </div>
        ) : (
          <div className="space-y-6">
            <AchievementList achievements={filteredAchievements} />
            {hasMore && filter === 'all' && (
              <button 
                onClick={loadMore}
                className="w-full py-6 text-[8.5px] font-mono text-neutral-300 hover:text-black lowercase tracking-[0.2em] transition-colors border-t border-neutral-50/50 border-dashed"
              >
                [load archive]
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="mt-20 pb-10 text-[7.5px] font-mono text-neutral-200 lowercase tracking-widest">
        &copy; {new Date().getFullYear()} max
      </footer>
    </div>
  );
}
