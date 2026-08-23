"use client";

import { useEffect, useRef, useState } from "react";

export type PlaceResult = {
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  placeId: string;
};

type LocationIQResult = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;

  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
};

export function BranchAddressAutocomplete({
  value,
  onChange,
  onSelect,
}: Props) {
  const [suggestions, setSuggestions] = useState<LocationIQResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * Fetch autocomplete suggestions
   */
  useEffect(() => {
    const query = value.trim();

    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);

      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

        if (!apiKey) {
          console.error("NEXT_PUBLIC_LOCATIONIQ_API_KEY is not configured");

          setSuggestions([]);
          setOpen(false);

          return;
        }

        const params = new URLSearchParams({
          key: apiKey,
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "5",
          countrycodes: "np",
        });

        const response = await fetch(
          `https://us1.locationiq.com/v1/autocomplete?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`LocationIQ request failed: ${response.status}`);
        }

        const data: LocationIQResult[] = await response.json();

        setSuggestions(data);
        setOpen(data.length > 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("LocationIQ autocomplete error:", error);

        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  /*
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Select suggestion
   */
  function handleSelect(place: LocationIQResult) {
    const address = place.display_name;

    const city =
      place.address?.city ??
      place.address?.town ??
      place.address?.village ??
      place.address?.county ??
      "";

    const result: PlaceResult = {
      address,
      city,
      latitude: place.lat,
      longitude: place.lon,
      placeId: place.place_id,
    };

    // Update parent's text value
    onChange(address);

    // Update parent's selected place
    onSelect(result);

    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder="Search address"
        value={value}
        autoComplete="off"
        onChange={(e) => {
          const newValue = e.target.value;

          console.log("Autocomplete input changed:", newValue);

          onChange(newValue);

          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        className="w-full rounded-md border px-3 py-2"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          )}

          {!loading && suggestions.length === 0 && value.trim().length >= 3 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No locations found
            </div>
          )}

          {!loading &&
            suggestions.map((place) => (
              <button
                key={place.place_id}
                type="button"
                className="block w-full px-3 py-3 text-left text-sm hover:bg-gray-100"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  handleSelect(place);
                }}
              >
                {place.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
