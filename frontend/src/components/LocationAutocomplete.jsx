import { useState, useEffect, useRef } from "react";

function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  className = "",
  onLocationDetect = null,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search function
  const searchLocations = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/location/search?q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Location search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.formatted);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Detect user location
  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/location/detect`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        onChange(data.data.formatted);
        if (onLocationDetect) {
          onLocationDetect(data.data);
        }
      } else {
        console.log("Could not detect location");
      }
    } catch (error) {
      console.error("Location detection error:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() =>
            value && suggestions.length > 0 && setShowSuggestions(true)
          }
          placeholder={placeholder}
          className={`${className} pr-20`}
        />

        {/* Detect Location Button */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={isDetecting}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Detect my location"
        >
          {isDetecting ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-xl max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-600 last:border-b-0 focus:outline-none focus:bg-dark-700"
            >
              <div className="text-slate-200 text-sm font-medium">
                {suggestion.formatted}
              </div>
              {suggestion.display_name !== suggestion.formatted && (
                <div className="text-slate-400 text-xs mt-1 truncate">
                  {suggestion.display_name}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;
