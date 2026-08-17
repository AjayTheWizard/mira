"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

export type PlaceResult = {
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  placeId: string;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    let listener: google.maps.MapsEventListener | null = null;

    loadGoogleMaps(apiKey).then(() => {
      if (!inputRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: [
            "formatted_address",
            "address_components",
            "geometry",
            "place_id",
          ],
          types: ["address"],
        },
      );

      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const city =
          place.address_components?.find((c) => c.types.includes("locality"))
            ?.long_name ??
          place.address_components?.find((c) =>
            c.types.includes("administrative_area_level_2"),
          )?.long_name ??
          "";

        onSelectRef.current({
          address: place.formatted_address ?? inputRef.current!.value,
          city,
          latitude: String(place.geometry.location.lat()),
          longitude: String(place.geometry.location.lng()),
          placeId: place.place_id ?? "",
        });
      });
    });

    return () => listener?.remove();
  }, []);

  return (
    <input
      ref={inputRef}
      placeholder="Search address"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
    />
  );
}
