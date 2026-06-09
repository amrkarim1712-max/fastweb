import { useState, useCallback, useRef } from 'react';
import { Library, LayoutTemplate, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddressBar } from './components/AddressBar';
import { ArticleView } from './components/ArticleView';
import { OfflineReader } from './components/OfflineReader';
import { Button } from './components/Button';
import type { Article, SavedArticle } from './types';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // Client-side cache for instant back/forward feel
  const articleCache = useRef(new Map<string, Article>());

  const fetchArticle = async (url: string) => {
    if (!url) return;
    
    setCurrentUrl(url);
    
    // Check client cache first
    const cached = articleCache.current.get(url);
    if (cached) {
      setArticle(cached);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setArticle(null);
    
    try {
      const response = await fetch(`/api/read?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to analyze page');
      }

      const data = await response.json();
      setArticle(data);
      // Save to client cache
      articleCache.current.set(url, data);
      
      // Limit cache size to prevent memory leaks in long sessions
      if (articleCache.current.size > 20) {
        const firstKey = articleCache.current.keys().next().value;
        if (firstKey) articleCache.current.delete(firstKey);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      setArticle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineArticleSelect = useCallback((savedArticle: SavedArticle) => {
    setArticle(savedArticle);
    setCurrentUrl(savedArticle.url);
    setIsLibraryOpen(false);
    articleCache.current.set(savedArticle.url, savedArticle);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Background ambient light */}
      <div className="fixed top-0 inset-x-0 h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950/80 to-zinc-950 pointer-events-none" />

      <AddressBar 
        onNavigate={fetchArticle} 
        isLoading={isLoading} 
        currentUrl={currentUrl}
      />

      <main className="flex-1 relative z-10 w-full pb-16">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.2 } }}
              className="min-h-[70vh] flex flex-col items-center justify-center space-y-10"
            >
              <div className="relative flex items-center justify-center">
                <motion.div 
                  className="absolute w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute w-16 h-16 border border-indigo-500/20 rounded-full mix-blend-overlay"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent pointer-events-none" />
                  <Compass className="w-5 h-5 text-indigo-300 animate-spin-slow mix-blend-screen" />
                </div>
              </div>
              <motion.div 
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-zinc-100 font-medium tracking-wide font-display text-lg">Distilling content</p>
                <div className="flex gap-1.5 justify-center opacity-70">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-indigo-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
                </div>
              </motion.div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[70vh] flex items-center justify-center p-6"
            >
              <div className="max-w-xl w-full p-8 bg-zinc-900/50 backdrop-blur-xl border border-red-900/30 rounded-3xl text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 text-red-400 flex items-center justify-center rounded-2xl mx-auto mb-6">
                  <LayoutTemplate className="w-8 h-8" />
                </div>
                <div className="text-zinc-100 font-medium text-lg mb-2">Navigation Error</div>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed max-w-sm mx-auto">{error}</p>
                <Button 
                  variant="primary" 
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                  onClick={() => fetchArticle(currentUrl)}
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          ) : article ? (
            <motion.div
              key="article"
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <ArticleView article={article} />
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 mt-12 md:mt-24 w-full"
            >
              <div className="w-32 h-32 mb-10 relative group">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
                <motion.div 
                  className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/30 w-full h-full rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden"
                  whileHover={{ rotate: 0, scale: 1.05 }}
                  initial={{ rotate: 8 }}
                  animate={{ rotate: 8 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                   <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-50" />
                   <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none mix-blend-overlay" />
                   <LayoutTemplate className="w-12 h-12 text-zinc-100 drop-shadow-md" strokeWidth={1} />
                </motion.div>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-semibold text-zinc-100 tracking-tight mb-5">
                Zenith
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto text-lg leading-relaxed mb-10 font-medium">
                A pristine reading environment.<br/>Enter a URL to distill the web.
              </p>
              
              <div className="mt-8 flex gap-4 overflow-x-auto max-w-2xl px-4 no-scrollbar pb-4 snap-x w-full justify-start md:justify-center">
                {[
                  { name: 'The Verge', url: 'https://theverge.com' },
                  { name: 'Wired', url: 'https://wired.com' },
                  { name: 'TechCrunch', url: 'https://techcrunch.com' },
                ].map((site, i) => (
                  <motion.button
                    key={site.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    onClick={() => fetchArticle(site.url)}
                    className="flex-none auto-cols-auto px-5 py-2.5 rounded-full bg-zinc-900/30 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-500 transition-all text-sm font-medium text-zinc-300 hover:text-white"
                  >
                    {site.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Library Button */}
      <motion.div 
        className="fixed bottom-8 right-8 z-30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <button
          onClick={() => setIsLibraryOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full shadow-2xl hover:bg-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <Library className="w-5 h-5 text-zinc-400 group-hover:text-zinc-100 transition-colors relative z-10" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 text-zinc-100 text-xs font-medium rounded-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap">
            Library
          </div>
        </button>
      </motion.div>

      <OfflineReader 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onArticleSelect={handleOfflineArticleSelect}
      />
    </div>
  );
}
