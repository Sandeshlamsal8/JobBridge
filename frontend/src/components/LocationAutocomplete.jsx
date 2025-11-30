import { useState, useEffect, useRef } from "react";

function LocationAutocomplete({ value, onChange, disabled, required }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceTimer = useRef(null);

  // Popular remote options
  const remoteOptions = [
    { display: "🌍 Remote (Worldwide)", value: "Remote (Worldwide)" },
    { display: "🇺🇸 Remote (US Only)", value: "Remote (US Only)" },
    { display: "🇪🇺 Remote (Europe Only)", value: "Remote (Europe Only)" },
    { display: "🌏 Remote (Asia Only)", value: "Remote (Asia Only)" },
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch location suggestions from OpenStreetMap Nominatim API (free)
  const fetchLocations = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions(remoteOptions);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim API (OpenStreetMap) - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: searchQuery,
            format: "json",
            addressdetails: 1,
            limit: 8,
            featuretype: "city",
          }),
        {
          headers: {
            "User-Agent": "JobBridge-App", // Required by Nominatim
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const formattedSuggestions = data.map((item) => {
          // Format: City, State/Region, Country
          const city =
            item.address.city ||
            item.address.town ||
            item.address.village ||
            item.name;
          const state = item.address.state || item.address.region || "";
          const country = item.address.country || "";

          let displayName = city;
          if (state && state !== city) displayName += `, ${state}`;
          if (country) displayName += `, ${country}`;

          return {
            display: displayName,
            value: displayName,
            lat: item.lat,
            lon: item.lon,
          };
        });

        // Add remote options at the top if query matches
        const allSuggestions = searchQuery.toLowerCase().includes("remote")
          ? [...remoteOptions, ...formattedSuggestions]
          : formattedSuggestions;

        setSuggestions(allSuggestions);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      setSuggestions(remoteOptions);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchLocations(newQuery);
    }, 300); // Wait 300ms after user stops typing
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.value);
    onChange({ target: { name: "location", value: suggestion.value } });
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Show remote options on focus if empty
  const handleFocus = () => {
    if (!query || query.length < 2) {
      setSuggestions(remoteOptions);
    }
    setShowSuggestions(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="input-field h-12 pr-10"
          placeholder="Type to search cities worldwide or 'Remote'..."
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 animate-spin text-primary-400"
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
          </div>
        )}
        {!isLoading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange({ target: { name: "location", value: "" } });
              setSuggestions(remoteOptions);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            disabled={disabled}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 glass-card rounded-xl border border-dark-700/50 shadow-2xl max-h-80 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  index === selectedIndex
                    ? "bg-primary-500/20 text-primary-300"
                    : "text-slate-300 hover:bg-dark-700/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400 flex-shrink-0"
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
                  <span className="text-sm font-medium">
                    {suggestion.display}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions &&
        !isLoading &&
        suggestions.length === 0 &&
        query.length >= 2 && (
          <div className="absolute z-50 w-full mt-2 glass-card rounded-xl border border-dark-700/50 shadow-2xl p-4">
            <p className="text-slate-400 text-sm text-center">
              No locations found. Try a different search term.
            </p>
          </div>
        )}
    </div>
  );
}

export default LocationAutocomplete;
