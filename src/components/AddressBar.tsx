import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddressBarProps {
  onNavigate: (url: string) => void;
  isLoading: boolean;
  currentUrl: string;
}

export function AddressBar({ onNavigate, isLoading, currentUrl }: AddressBarProps) {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setInputUrl(currentUrl);
    }
  }, [currentUrl, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    
    let target = inputUrl.trim();
    
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
    const isDomainLike = target.includes('localhost') || urlPattern.test(target);
    
    if (!isDomainLike) {
      target = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    
    onNavigate(target);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputUrl('');
    inputRef.current?.focus();
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none">
      <motion.form 
        layout
        onSubmit={handleSubmit}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative flex items-center gap-2 bg-zinc-900/60 border border-zinc-700/50 rounded-full p-2.5 shadow-2xl backdrop-blur-2xl pointer-events-auto transition-all duration-500 will-change-transform lg:mt-4 ${
          isFocused ? 'w-full max-w-3xl bg-zinc-900/80 border-indigo-500/50 shadow-indigo-500/10' : 'w-full max-w-xl hover:bg-zinc-800/80 hover:border-zinc-600/50'
        }`}
      >
        <div className="pl-4 pr-1 text-zinc-500">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-indigo-400"
              >
                <RefreshCw className="w-[18px] h-[18px] animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={isFocused ? 'text-indigo-400' : 'text-zinc-500'}
              >
                {isFocused || !currentUrl ? <Search className="w-[18px] h-[18px]" /> : <Globe className="w-[18px] h-[18px]" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search or enter web address"
          className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:outline-none text-base md:text-lg px-2 py-2 font-display font-medium tracking-wide w-full"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <AnimatePresence>
          {inputUrl && isFocused && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              type="button"
              onClick={handleClear}
              className="p-2 mr-1 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isFocused && inputUrl && (
            <motion.button 
              initial={{ opacity: 0, x: -10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -10, width: 0 }}
              type="submit" 
              className="rounded-full px-5 py-2.5 ml-1 bg-zinc-100 text-zinc-950 font-medium text-sm hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap overflow-hidden hidden sm:block"
            >
              Go
            </motion.button>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}
