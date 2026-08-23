"use client";

import { LocateFixed, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CustomerLocation = {
  label: string;
  lat: number;
  lng: number;
};

type LocationIQResult = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: { city?: string; town?: string; village?: string; suburb?: string };
};

type Props = {
  value: CustomerLocation | null;
  onChange: (location: CustomerLocation | null) => void;
};

export function CustomerLocationSearch({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<LocationIQResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = text.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
        if (!apiKey) {
          console.error("NEXT_PUBLIC_LOCATIONIQ_API_KEY is not configured");
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
        const res = await fetch(
          `https://us1.locationiq.com/v1/autocomplete?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`LocationIQ request failed: ${res.status}`);
        const data: LocationIQResult[] = await res.json();
        setSuggestions(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("LocationIQ autocomplete error:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [text]);

  function pick(result: LocationIQResult) {
    const label =
      result.address?.city ??
      result.address?.town ??
      result.address?.village ??
      result.address?.suburb ??
      result.display_name.split(",")[0];
    onChange({ label, lat: Number(result.lat), lng: Number(result.lon) });
    setText("");
    setSuggestions([]);
    setOpen(false);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
          const params = new URLSearchParams({
            key: apiKey ?? "",
            lat: String(latitude),
            lon: String(longitude),
            format: "json",
          });
          const res = await fetch(
            `https://us1.locationiq.com/v1/reverse?${params.toString()}`,
          );
          const data: LocationIQResult = await res.json();
          const label =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.suburb ??
            "Current location";
          onChange({ label, lat: latitude, lng: longitude });
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          onChange({ label: "Current location", lat: latitude, lng: longitude });
        } finally {
          setLocating(false);
          setOpen(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  return (
    <div ref={containerRef} className="location-chip" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}
      >
        <MapPin size={15} />
        <span>{value?.label ?? "Set location"}</span>
      </button>
      {value && (
        <button
          type="button"
          aria-label="Clear location"
          onClick={() => onChange(null)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
        >
          <X size={13} />
        </button>
      )}

      {open && (
        <div className="absolute-dropdown" style={{
          position: "absolute", top: "100%", left: 0, marginTop: 6, background: "white",
          border: "1px solid #e5e5e5", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          width: 280, zIndex: 50, overflow: "hidden",
        }}>
          <div style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search a city or area..."
              style={{ width: "100%", border: "1px solid #e5e5e5", borderRadius: 8, padding: "8px 10px" }}
            />
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
              background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 14,
            }}
          >
            <LocateFixed size={15} />
            {locating ? "Locating..." : "Use my current location"}
          </button>
          {loading && <div style={{ padding: "8px 12px", fontSize: 13, color: "#888" }}>Searching...</div>}
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => pick(s)}
              style={{
                display: "block", width: "100%", padding: "10px 12px", textAlign: "left",
                background: "none", border: "none", borderTop: "1px solid #f5f5f5", cursor: "pointer", fontSize: 13,
              }}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
