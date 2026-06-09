import { get, set, del, update, keys, values } from 'idb-keyval';
import type { SavedArticle, Article } from '../types';

const STORE_KEY = 'zenith_saved_articles';

export async function saveArticle(article: Article): Promise<string> {
  const id = btoa(article.url).replace(/=/g, '');
  const savedArticle: SavedArticle = {
    ...article,
    id,
    savedAt: Date.now(),
  };

  await update(STORE_KEY, (val: SavedArticle[] = []) => {
    // Check if already exists to prevent duplicates
    const exists = val.some(a => a.id === id);
    if (exists) return val;
    return [savedArticle, ...val];
  });
  
  return id;
}

export async function getSavedArticles(): Promise<SavedArticle[]> {
  const articles = await get<SavedArticle[]>(STORE_KEY);
  return articles || [];
}

export async function getSavedArticle(id: string): Promise<SavedArticle | undefined> {
  const articles = await getSavedArticles();
  return articles.find(a => a.id === id);
}

export async function removeSavedArticle(id: string): Promise<void> {
  await update(STORE_KEY, (val: SavedArticle[] = []) => {
    return val.filter(a => a.id !== id);
  });
}

export async function isArticleSaved(url: string): Promise<boolean> {
  const id = btoa(url).replace(/=/g, '');
  const articles = await getSavedArticles();
  return articles.some(a => a.id === id);
}
