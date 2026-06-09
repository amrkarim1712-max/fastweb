import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, ExternalLink, Clock, Share2, Type, TypeIcon, Sparkles, Volume2, SquareSquare, Maximize, Printer, VolumeX } from 'lucide-react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import type { Article } from '../types';
import { isArticleSaved, saveArticle, removeSavedArticle } from '../lib/storage';
import { calculateReadingTime } from '../lib/format';
import { Button } from './Button';

interface ArticleViewProps {
  article: Article;
  onOfflineToggle?: () => void;
}

export function ArticleView({ article, onOfflineToggle }: ArticleViewProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('serif');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Restore scroll position
  useEffect(() => {
    const savedProgress = localStorage.getItem(`readProgress-${article.url}`);
    if (savedProgress) {
      const scrollPos = parseFloat(savedProgress);
      // Timeout needed for layout to finish rendering
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      }, 400);
    }
  }, [article.url]);

  // Save scroll position
  useEffect(() => {
    let timeoutId: any;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = window.scrollY;
        if (scrollTop > 100) {
          localStorage.setItem(`readProgress-${article.url}`, scrollTop.toString());
        }
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [article.url]);

  useEffect(() => {
    checkSavedStatus();
    setSummary(null);
    setIsSummarizing(false);
    document.title = article.title ? `${article.title} - Zenith` : 'Zenith';
    return () => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      document.title = 'Zenith';
    };
  }, [article.url]);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(article.title + ". " + article.textContent);
      utterance.rate = 1.05;
      utterance.pitch = 1;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generateSummary = async () => {
    if (summary) {
      setSummary(null); // toggle off
      return;
    }
    
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: article.textContent })
      });
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        alert(data.error || 'Failed to summarize');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to summarize service');
    } finally {
      setIsSummarizing(false);
    }
  };

  const checkSavedStatus = async () => {
    const saved = await isArticleSaved(article.url);
    setIsSaved(saved);
  };

  const handleToggleSave = async () => {
    if (isSaved) {
      const id = btoa(article.url).replace(/=/g, '');
      await removeSavedArticle(id);
      setIsSaved(false);
    } else {
      await saveArticle(article);
      setIsSaved(true);
    }
    if (onOfflineToggle) onOfflineToggle();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: article.url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(article.url);
      alert('Link copied to clipboard!');
    }
  };

  const cycleFontSize = () => {
    const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
    const currentIndex = sizes.indexOf(fontSize);
    setFontSize(sizes[(currentIndex + 1) % sizes.length]);
  };

  const fontSizeClasses = {
    sm: 'prose-sm md:prose-base prose-p:leading-[1.7]',
    base: 'prose-base md:prose-lg prose-p:leading-[1.8]',
    lg: 'prose-lg md:prose-xl prose-p:leading-[1.85]',
    xl: 'prose-xl md:prose-2xl prose-p:leading-[1.9]',
  };

  return (
    <>
      {/* Reading Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/50 to-indigo-400 origin-left z-50 pointer-events-none"
        style={{ scaleX }}
      />
      
      <div className="max-w-[760px] mx-auto px-6 py-12 md:py-24 animate-in fade-in duration-700 zoom-in-95">
        
        {/* Floating Toolbar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="sticky top-28 md:top-32 right-0 flex justify-end mb-8 z-40 pointer-events-none"
        >
          <div className="inline-flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-[0_0_40px_-10px_rgba(99,102,241,0.25)] pointer-events-auto transition-all duration-500">
            <button 
              onClick={generateSummary}
              disabled={isSummarizing}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${summary ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
              title="AI Summary"
            >
              <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-pulse' : ''}`} />
            </button>
            <button 
              onClick={toggleSpeech}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${isPlaying ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
              title={isPlaying ? "Stop Voice" : "Read Aloud"}
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1"></div>
            <button 
              onClick={() => setFontFamily(f => f === 'serif' ? 'sans' : 'serif')}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${fontFamily === 'serif' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
              title="Toggle Serif/Sans font"
            >
              <TypeIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={cycleFontSize}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs font-medium"
              title="Cycle font size"
            >
              Tt
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1"></div>
            <button 
              onClick={handleToggleSave}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${isSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
              title={isSaved ? "Saved offline" : "Save offline"}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-center hidden sm:flex"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button 
              onClick={handlePrint}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-center hidden sm:flex"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <header className="mb-16 space-y-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            {article.siteName && (
              <span className="font-bold text-zinc-400 tracking-widest uppercase text-xs">
                {article.siteName}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {calculateReadingTime(article.textContent)} min read
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-medium text-zinc-50 leading-[1.15] tracking-tight text-balance py-4 drop-shadow-sm">
            {article.title}
          </h1>

          <div className="flex items-center justify-between py-8 border-y border-white/5 flex-wrap gap-4 mt-12 mb-16">
            {article.byline && (
              <div className="text-zinc-300 font-medium tracking-tight text-lg font-display">
                <span className="text-zinc-600 mr-2 italic font-serif">By</span>
                {article.byline}
              </div>
            )}
            
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group inline-flex items-center text-sm font-semibold tracking-wide uppercase text-zinc-500 hover:text-indigo-400 transition-colors ml-auto relative"
            >
              <span className="relative z-10">Original Article</span>
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </header>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-gradient-to-br from-indigo-950/40 to-zinc-900/50 border border-indigo-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-50 mix-blend-screen overflow-hidden">
                  <Sparkles className="w-48 h-48 text-indigo-500/10 -translate-y-12 translate-x-12" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 text-indigo-300 font-medium relative z-10 font-display tracking-wide">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  AI Summary
                </div>
                <div className="prose prose-indigo prose-invert max-w-none relative z-10 text-indigo-100/90 whitespace-pre-wrap font-sans leading-relaxed text-base md:text-lg">
                  {summary}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <article 
          dir={article.dir || 'auto'}
          className={`
            prose prose-zinc prose-invert max-w-none 
            hover:prose-a:text-indigo-400 
            prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-zinc-50 prose-headings:tracking-tight
            prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-zinc-800/50
            prose-a:underline prose-a:decoration-zinc-800 prose-a:underline-offset-4 hover:prose-a:decoration-indigo-400
            prose-pre:bg-zinc-900/80 prose-pre:backdrop-blur-md prose-pre:border prose-pre:border-zinc-800/80 prose-pre:rounded-2xl prose-pre:text-sm
            selection:bg-indigo-500/30 selection:text-indigo-100
            ${fontSizeClasses[fontSize]}
            ${fontFamily === 'serif' ? 'prose-p:font-serif prose-p:font-normal prose-headings:font-display' : 'prose-p:font-display prose-headings:font-serif'}
          `}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        <div className="mt-24 pt-12 border-t border-zinc-800/50 flex flex-col items-center justify-center text-center">
           <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6">
             <BookmarkCheck className="w-5 h-5 text-zinc-500" />
           </div>
           <p className="text-zinc-400 text-sm">
             You reached the end.
           </p>
        </div>
      </div>
    </>
  );
}
