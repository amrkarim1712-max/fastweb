import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'isomorphic-dompurify';
import { GoogleGenAI } from '@google/genai';

// Simple in-memory cache to prevent refetching the same URL repeatedly
const articleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/summarize', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Missing text content' });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI capabilities are not configured (Missing API Key)' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following article in a few short, concise bullet points to give the reader a quick overview before they read it. Format it nicely as simple plain text bullet points (using •).\n\nText:\n${text.slice(0, 40000)}`
      });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error('Summarize Error:', error);
      res.status(500).json({ error: 'Failed to generate summary', details: error.message });
    }
  });

  app.get('/api/read', async (req, res) => {
    let targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
      // Basic URL formatting
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      
      const parsedUrl = new URL(targetUrl);
      const normalizedUrl = parsedUrl.toString();

      // Check cache
      const cached = articleCache.get(normalizedUrl);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
      
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Use JSDOM to parse the HTML
      const doc = new JSDOM(html, { url: targetUrl });

      // --- Advanced Distraction / Ad Blocking ---
      // Forcefully remove known distracting elements before Readability processes the tree
      const selectorsToRemove = [
        'script', 'noscript', 'style', 'link', 'iframe', 'object', 'embed', // External media / scripts
        '.ad', '.ads', '.advertisement', '.banner', '.cookie-banner', '.newsletter', // Common ad/banner names
        '[id*="cookie"]', '[class*="cookie"]', // Cookie notices
        '[id*="popup"]', '[class*="popup"]', // Popups
        '[id*="modal"]', '[class*="modal"]', // Modals
        '[class*="paywall"]', '[id*="paywall"]', // Paywalls
        'aside', '.sidebar', '[class*="sidebar"]', // Sidebars
        '.social-share', '[class*="share"]', // Share buttons
        'nav', 'header', 'footer' // Site chrome
      ];
      doc.window.document.querySelectorAll(selectorsToRemove.join(',')).forEach(el => el.remove());
      
      // Use Readability to extract the main content (strips ads, sidebars, navigation)
      const reader = new Readability(doc.window.document);
      let article = reader.parse();

      if (!article) {
        // Fallback for non-article pages
        article = {
          title: doc.window.document.title || targetUrl,
          byline: '',
          dir: 'auto',
          content: doc.window.document.body ? doc.window.document.body.innerHTML : html,
          textContent: doc.window.document.body ? (doc.window.document.body.textContent || '') : '',
          length: html.length,
          excerpt: '',
          siteName: parsedUrl.hostname,
          lang: '',
          publishedTime: ''
        };
      }

      // Sanitize the resulting HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(article.content, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target'] // allow links to open in new tabs if modified
      });

      const responseData = {
        title: article.title,
        byline: article.byline,
        dir: article.dir,
        content: cleanHtml,
        textContent: article.textContent,
        length: article.length,
        excerpt: article.excerpt,
        siteName: article.siteName,
        url: targetUrl
      };

      // Set cache
      articleCache.set(normalizedUrl, { data: responseData, timestamp: Date.now() });

      res.json(responseData);
    } catch (error: unknown) {
      console.error('Proxy Fetch Error:', error);
      const details = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        error: 'Failed to process the URL.', 
        details: details 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
