"use client";

import { useState, useEffect } from "react";
import { CountryCode } from "@/types";

export function useZipLookup(
  zipCode: string,
  country: CountryCode,
  onResolve: (city: string, state: string) => void
) {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cleaned = zipCode.trim().toUpperCase();
    if (!cleaned) {
      setError(null);
      return;
    }

    // Determine if zip code meets minimum character length for lookup
    let isQueryable = false;
    let url = "";

    if (country === "US") {
      // US requires 5 digits (e.g. 90210)
      isQueryable = /^\d{5}$/.test(cleaned);
      url = `https://api.zippopotam.us/us/${cleaned}`;
    } else if (country === "CA") {
      // CA requires first 3 characters of postal code (e.g. M5V)
      const outerCode = cleaned.replace(/\s+/g, "");
      isQueryable = outerCode.length >= 3;
      url = `https://api.zippopotam.us/ca/${outerCode.slice(0, 3)}`;
    } else if (country === "UK") {
      // UK: Outer code (e.g., SW1A, EC1A). Match first word or first 3-4 chars
      const parts = cleaned.split(/\s+/);
      const outerCode = parts[0];
      isQueryable = outerCode.length >= 2 && outerCode.length <= 4;
      url = `https://api.zippopotam.us/gb/${outerCode}`;
    }

    if (!isQueryable) {
      setError(null);
      return;
    }

    const fetchZipData = async () => {
      setIsValidating(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Invalid postal code");
        }
        const data = await response.json();
        const place = data.places?.[0];
        if (place) {
          const city = place["place name"];
          const state = place["state abbreviation"] || place["state"] || "";
          onResolve(city, state);
        } else {
          throw new Error("Location not found");
        }
      } catch (err) {
        setError("Postal code not recognized");
      } finally {
        setIsValidating(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchZipData();
    }, 500); // 500ms debounce to avoid spamming the public API

    return () => clearTimeout(delayDebounce);
  }, [zipCode, country]);

  return { isValidating, error };
}
