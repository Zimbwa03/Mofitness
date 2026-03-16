import type { CoachFilters, CoachRecord } from "./types";
import { haversineDistanceKm } from "./calculations";

export function slugifyCoachName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function applyCoachFilters(coaches: CoachRecord[], filters: CoachFilters) {
  const searchTerm = filters.search?.trim().toLowerCase();

  const enriched = coaches
    .map((coach) => {
      const distanceKm =
        filters.userLat !== null &&
        filters.userLat !== undefined &&
        filters.userLng !== null &&
        filters.userLng !== undefined &&
        coach.lat !== null &&
        coach.lat !== undefined &&
        coach.lng !== null &&
        coach.lng !== undefined
          ? haversineDistanceKm({
              lat1: filters.userLat,
              lng1: filters.userLng,
              lat2: Number(coach.lat),
              lng2: Number(coach.lng),
            })
          : null;

      return {
        coach,
        distanceKm,
      };
    })
    .filter(({ coach, distanceKm }) => {
      if (coach.status !== "approved") {
        return false;
      }

      if (searchTerm) {
        const haystack = [
          coach.full_name,
          coach.tagline ?? "",
          coach.city,
          coach.country,
          coach.bio,
          coach.specialisations.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      if (filters.specialisations?.length) {
        const hasMatch = filters.specialisations.some((entry) =>
          coach.specialisations.includes(entry),
        );
        if (!hasMatch) {
          return false;
        }
      }

      if (filters.sessionTypes?.length) {
        const hasSession = filters.sessionTypes.some((entry) =>
          coach.session_types.includes(entry),
        );
        if (!hasSession) {
          return false;
        }
      }

      if (
        filters.maxPriceUsd !== null &&
        filters.maxPriceUsd !== undefined &&
        coach.price_per_hour_usd !== null &&
        coach.price_per_hour_usd !== undefined &&
        Number(coach.price_per_hour_usd) > filters.maxPriceUsd
      ) {
        return false;
      }

      if (
        filters.minRating !== null &&
        filters.minRating !== undefined &&
        Number(coach.avg_rating) < filters.minRating
      ) {
        return false;
      }

      if (
        filters.radiusKm !== null &&
        filters.radiusKm !== undefined &&
        distanceKm !== null &&
        distanceKm > filters.radiusKm
      ) {
        return false;
      }

      return true;
    });

  enriched.sort((a, b) => {
    switch (filters.sort) {
      case "highest_rated":
        return Number(b.coach.avg_rating) - Number(a.coach.avg_rating);
      case "most_reviewed":
        return b.coach.total_reviews - a.coach.total_reviews;
      case "price_low_to_high":
        return Number(a.coach.price_per_hour_usd ?? Number.MAX_SAFE_INTEGER) - Number(b.coach.price_per_hour_usd ?? Number.MAX_SAFE_INTEGER);
      case "best_match":
      case "nearest":
      default:
        if (a.distanceKm === null && b.distanceKm === null) {
          return Number(b.coach.avg_rating) - Number(a.coach.avg_rating);
        }
        if (a.distanceKm === null) {
          return 1;
        }
        if (b.distanceKm === null) {
          return -1;
        }
        return a.distanceKm - b.distanceKm;
    }
  });

  return enriched;
}
