export interface Article {
  title: string;
  byline: string;
  dir: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName: string;
  url: string;
  readingTime: number;
}

export interface SavedArticle extends Article {
  id: string;
  savedAt: number;
}
