import { useState, useEffect, useMemo } from 'react';
import { Bookmark, Clock, Trash2, ArrowRight, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSavedArticles, removeSavedArticle } from '../lib/storage';
import { formatDate, calculateReadingTime } from '../lib/format';
import type { SavedArticle } from '../types';

interface OfflineReaderProps {
  onArticleSelect: (article: SavedArticle) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineReader({ onArticleSelect, isOpen, onClose }: OfflineReaderProps) {
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadArticles();
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadArticles = async () => {
    const saved = await getSavedArticles();
    setArticles(saved.sort((a, b) => b.savedAt - a.savedAt));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeSavedArticle(id);
    await loadArticles();
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter(article => 
      article.title?.toLowerCase().includes(query) ||
      article.siteName?.toLowerCase().includes(query) ||
      article.textContent?.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-md cursor-pointer"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-zinc-950/95 backdrop-blur-3xl border-l border-white/5 shadow-2xl flex flex-col"
          >
            <div className="p-6 pb-4 border-b border-zinc-800/80 flex flex-col gap-4 bg-zinc-900/50 backdrop-blur z-10 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Bookmark className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="font-semibold text-xl tracking-tight font-display">Library</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              {articles.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved articles..."
                    className="block w-full pl-10 pr-10 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-200 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {articles.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-800/30 border border-zinc-800 flex items-center justify-center mb-2">
                    <Bookmark className="w-6 h-6 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 font-medium">Your library is empty</p>
                  <p className="text-sm max-w-[250px] text-center leading-relaxed">Save articles to read them later, completely free of ads and distractions.</p>
                </motion.div>
              ) : filteredArticles.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 text-zinc-500 space-y-2"
                >
                  <Search className="w-8 h-8 text-zinc-700 mb-2" />
                  <p className="text-zinc-400 font-medium text-sm">No matches found</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {filteredArticles.map((article, i) => (
                    <motion.div
                      key={article.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => onArticleSelect(article)}
                      className="group relative p-5 rounded-3xl bg-zinc-800/20 border border-white/5 hover:bg-zinc-800/60 hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col gap-3 shadow-sm hover:shadow-xl"
                    >
                      <div>
                        <h3 className="text-zinc-100 font-serif font-medium leading-snug line-clamp-2 pr-6 group-hover:text-indigo-400 transition-colors pointer-events-none">
                          {article.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-2 font-medium tracking-wide uppercase font-display pointer-events-none">{article.siteName || new URL(article.url).hostname}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-zinc-500 mt-1">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {calculateReadingTime(article.textContent)} min
                          </span>
                          <span>•</span>
                          <span>{formatDate(article.savedAt)}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, article.id)}
                        className="absolute right-3 top-4 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove from library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
