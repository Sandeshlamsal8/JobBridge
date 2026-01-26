import { useState, useEffect } from "react";
import { useJobCategories } from "../hooks/useJobCategories";

function SearchableCategories({ selectedCategories, onCategoriesChange, required = false }) {
  const { categories: allCategories, isLoading, error, refetch } = useJobCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Filter categories based on search term
  useEffect(() => {
    if (!allCategories.length) {
      setFilteredCategories([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredCategories(allCategories);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = allCategories.filter(category => 
      category.label.toLowerCase().includes(searchLower) ||
      category.value.toLowerCase().includes(searchLower)
    );
    setFilteredCategories(filtered);
  }, [allCategories, searchTerm]);

  const handleCategoryToggle = (categoryValue) => {
    const updatedCategories = selectedCategories.includes(categoryValue)
      ? selectedCategories.filter(cat => cat !== categoryValue)
      : [...selectedCategories, categoryValue];
    
    onCategoriesChange(updatedCategories);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Job Categories {required && "*"} (Select all that interest you)
      </label>
      
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search categories..."
            className="w-full px-4 py-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <svg
              className="w-8 h-8 animate-spin text-primary-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-slate-400 text-sm">Loading categories...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={refetch}
            className="text-primary-400 hover:text-primary-300 text-sm"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {filteredCategories.map((category) => (
            <label
              key={category.value}
              className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.value)}
                onChange={() => handleCategoryToggle(category.value)}
                className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-300 font-medium">
                  {category.label}
                </span>
                {category.jobCount > 0 && (
                  <span className="text-xs text-slate-500 ml-2">
                    ({category.jobCount} jobs)
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Selected Categories Summary */}
      {selectedCategories.length > 0 && (
        <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <p className="text-sm text-primary-300 mb-2">
            Selected categories ({selectedCategories.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((categoryValue) => {
              const category = allCategories.find(cat => cat.value === categoryValue);
              return (
                <span
                  key={categoryValue}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs"
                >
                  {category ? category.label : categoryValue}
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(categoryValue)}
                    className="ml-1 text-primary-400 hover:text-primary-200"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* No results message */}
      {!isLoading && !error && filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">
            No categories found for "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchableCategories;