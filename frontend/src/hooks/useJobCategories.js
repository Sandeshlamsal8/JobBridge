import { useState, useEffect } from "react";

export function useJobCategories(includeAll = false) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/categories`
      );
      const data = await response.json();
      
      if (data.success) {
        let categoriesList = data.data.categories;
        
        // Add "All Categories" option if requested (for filtering)
        if (includeAll) {
          categoriesList = [
            { value: "", label: "All Categories", jobCount: 0 },
            ...categoriesList
          ];
        }
        
        setCategories(categoriesList);
        setError(null);
      } else {
        setError("Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchCategories();
  };

  return { categories, isLoading, error, refetch };
}