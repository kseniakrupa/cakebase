import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const base = 'CakeBase';
    document.title = title ? `${title} — ${base}` : `${base} — база знаний о тортах`;
  }, [title]);
}
