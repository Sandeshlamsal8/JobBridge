const axios = require("axios");

class LocationService {
  /**
   * Get location suggestions based on query
   * Uses OpenStreetMap Nominatim API (free, no API key required)
   */
  static async searchLocations(query) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      // First try with no country restrictions for global coverage
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: query.trim(),
            format: "json",
            limit: 15,
            addressdetails: 1,
            extratags: 1,
            namedetails: 1,
            "accept-language": "en,en-US;q=0.9", // Prefer English names
          },
          headers: {
            "User-Agent": "JobBridge-App/1.0",
            "Accept-Language": "en,en-US;q=0.9", // Request English responses
          },
          timeout: 8000,
        }
      );

      // Filter and sort results for better relevance
      const locations = response.data
        .filter((location) => {
          // Filter out very specific places like individual buildings unless they're important
          const type = location.type;
          const category = location.category;

          // Include cities, towns, villages, states, countries, and important places
          return (
            category === "place" ||
            category === "boundary" ||
            type === "city" ||
            type === "town" ||
            type === "village" ||
            type === "municipality" ||
            type === "county" ||
            type === "state" ||
            type === "country" ||
            type === "administrative"
          );
        })
        .map((location) => ({
          display_name: location.display_name,
          city:
            location.address?.city ||
            location.address?.town ||
            location.address?.village ||
            location.address?.municipality ||
            "",
          state:
            location.address?.state ||
            location.address?.province ||
            location.address?.region ||
            "",
          country: location.address?.country || "",
          formatted: this.formatLocation(location.address),
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon),
          type: location.type,
          importance: location.importance || 0,
        }))
        .sort((a, b) => (b.importance || 0) - (a.importance || 0)) // Sort by importance
        .slice(0, 10); // Limit to top 10 results

      return locations;
    } catch (error) {
      console.error("Location search error:", error.message);
      return [];
    }
  }

  /**
   * Get user's location based on IP (using ipapi.co - free tier)
   */
  static async getLocationByIP(ip) {
    try {
      // Skip for localhost/private IPs
      if (
        !ip ||
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.")
      ) {
        return null;
      }

      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 3000,
      });

      const data = response.data;

      if (data.error) {
        console.log("IP location error:", data.reason);
        return null;
      }

      return {
        city: data.city || "",
        state: data.region || "",
        country: data.country_name || "",
        formatted: this.formatLocationFromIP(data),
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone,
      };
    } catch (error) {
      console.error("IP location error:", error.message);
      return null;
    }
  }

  /**
   * Format location from Nominatim response with English preference
   */
  static formatLocationWithEnglish(address, namedetails) {
    if (!address) return "";

    const parts = [];

    // Try to get English names first
    const getEnglishName = (field) => {
      if (namedetails && namedetails[`${field}:en`]) {
        return namedetails[`${field}:en`];
      }
      return address[field];
    };

    // Add city/town/village/municipality
    if (address.city) parts.push(getEnglishName("city") || address.city);
    else if (address.town) parts.push(getEnglishName("town") || address.town);
    else if (address.village)
      parts.push(getEnglishName("village") || address.village);
    else if (address.municipality)
      parts.push(getEnglishName("municipality") || address.municipality);
    else if (address.county)
      parts.push(getEnglishName("county") || address.county);

    // Add state/province/region
    if (address.state) parts.push(getEnglishName("state") || address.state);
    else if (address.province)
      parts.push(getEnglishName("province") || address.province);
    else if (address.region)
      parts.push(getEnglishName("region") || address.region);

    // Add country (prefer English)
    if (address.country) {
      const countryName = getEnglishName("country") || address.country;
      // Convert common country names to English
      const countryMap = {
        नेपाल: "Nepal",
        भारत: "India",
        বাংলাদেশ: "Bangladesh",
        ভারত: "India",
      };
      parts.push(countryMap[countryName] || countryName);
    }

    return parts.join(", ");
  }

  /**
   * Format location from Nominatim response
   */
  static formatLocation(address) {
    if (!address) return "";

    const parts = [];

    // Add city/town/village/municipality
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.village) parts.push(address.village);
    else if (address.municipality) parts.push(address.municipality);
    else if (address.county) parts.push(address.county);

    // Add state/province/region
    if (address.state) parts.push(address.state);
    else if (address.province) parts.push(address.province);
    else if (address.region) parts.push(address.region);

    // Add country
    if (address.country) parts.push(address.country);

    return parts.join(", ");
  }

  /**
   * Format location from IP API response
   */
  static formatLocationFromIP(data) {
    const parts = [];

    if (data.city) parts.push(data.city);
    if (data.region) parts.push(data.region);
    if (data.country_name) parts.push(data.country_name);

    return parts.join(", ");
  }

  /**
   * Validate coordinates
   */
  static isValidCoordinates(lat, lon) {
    return (
      typeof lat === "number" &&
      typeof lon === "number" &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }
}

module.exports = LocationService;
