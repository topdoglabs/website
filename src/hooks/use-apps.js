import { useEffect, useState } from "react";

const emptyApps = [];

export const useApps = () => {
  const [apps, setApps] = useState(emptyApps);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadApps = async () => {
      try {
        const response = await fetch("/apps.json");
        if (!response.ok) {
          throw new Error("Failed to load apps");
        }
        const data = await response.json();
        if (isMounted) {
          setApps(Array.isArray(data) ? data : emptyApps);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setApps(emptyApps);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApps();

    return () => {
      isMounted = false;
    };
  }, []);

  return { apps, isLoading, error };
};
