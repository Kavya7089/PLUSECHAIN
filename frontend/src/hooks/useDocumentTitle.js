import { useEffect } from 'react';

/**
 * Custom hook to dynamically manage document <title> and meta[name="description"]
 * @param {string} title 
 * @param {string} description 
 */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | PulseChain`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    const prevDesc = metaDesc.getAttribute('content') || '';
    if (description) {
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
