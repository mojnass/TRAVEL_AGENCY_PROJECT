package com.patronustravel.catalog;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class SeedData {
  private final CatalogStore store;

  public SeedData(CatalogStore store) {
    this.store = store;
  }

  @PostConstruct
  void seed() {
    if (store.isDatabaseBacked()) {
      return;
    }
    store.seed("flight_offers", "offer_id", List.of(
        Map.of("offer_id", "flt-001", "origin", "BEY", "destination", "IST", "airline_code", "TK", "flight_number", "TK825", "cabin_class", "economy", "stops", 0, "availability", 28, "price", 215),
        Map.of("offer_id", "flt-002", "origin", "BEY", "destination", "DXB", "airline_code", "ME", "flight_number", "ME430", "cabin_class", "business", "stops", 0, "availability", 8, "price", 810)
    ));
    store.seed("hotels", "hotel_id", List.of(
        Map.of("hotel_id", "hotel-001", "name", "Cedar Coast Hotel", "city", "Beirut", "country", "Lebanon", "star_rating", 5, "rating", 4.7),
        Map.of("hotel_id", "hotel-002", "name", "Old Town Suites", "city", "Istanbul", "country", "Turkey", "star_rating", 4, "rating", 4.4)
    ));
    store.seed("restaurants", "restaurant_id", List.of(
        Map.of("restaurant_id", "rest-001", "name", "Saffron Table", "city", "Beirut", "cuisine_type", "Lebanese", "price_tier", "$$", "rating", 4.8),
        Map.of("restaurant_id", "rest-002", "name", "Harbor Grill", "city", "Dubai", "cuisine_type", "Seafood", "price_tier", "$$$", "rating", 4.5)
    ));
    store.seed("attractions", "attraction_id", List.of(
        Map.of("attraction_id", "attr-001", "name", "National Museum", "city", "Beirut", "category", "Museum", "requires_advance_booking", false, "rating", 4.6),
        Map.of("attraction_id", "attr-002", "name", "Bosphorus Cruise", "city", "Istanbul", "category", "Tour", "requires_advance_booking", true, "rating", 4.9)
    ));
    store.seed("spa_venues", "spa_id", List.of(
        Map.of("spa_id", "spa-001", "name", "Azure Spa", "city", "Beirut", "type", "Wellness", "rating", 4.6),
        Map.of("spa_id", "spa-002", "name", "Palm Hammam", "city", "Dubai", "type", "Hammam", "rating", 4.7)
    ));
    store.seed("bundles", "bundle_id", List.of(
        Map.of("bundle_id", "bundle-001", "title", "Beirut Weekend", "destination", "Beirut", "status", "published", "total_original_price", 900, "discounted_price", 760),
        Map.of("bundle_id", "bundle-002", "title", "Istanbul Culture Trip", "destination", "Istanbul", "status", "published", "total_original_price", 1200, "discounted_price", 990)
    ));
  }
}
