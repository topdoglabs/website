import { useEffect, useState } from "react";

const emptyContent = { footerColumns: [], pages: {} };

export const useSiteContent = () => {
  const [content, setContent] = useState(emptyContent);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const response = await fetch("/site.json");
        if (!response.ok) {
          throw new Error("Failed to load site content");
        }
        const data = await response.json();
        if (isMounted) {
          setContent(data || emptyContent);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setContent(emptyContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, isLoading, error };
};
