package com.patronustravel.flights;

import com.patronustravel.catalog.CatalogStore;
import com.patronustravel.catalog.CrudControllerSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flights")
public class FlightController extends CrudControllerSupport {
  public FlightController(CatalogStore store) {
    super(store, "flight_offers", "offer_id");
  }

  @GetMapping("/search")
  public List<Map<String, Object>> search(@RequestParam Map<String, String> filters) {
    List<Map<String, Object>> results = store.list("flight_offers", filters);
    Map<String, Object> cacheRow = new LinkedHashMap<>();
    cacheRow.putAll(filters);
    cacheRow.put("search_results", results);
    cacheRow.put("cached_at", Instant.now().toString());
    cacheRow.put("expires_at", Instant.now().plusSeconds(900).toString());
    store.create("flight_search_cache", "cache_id", cacheRow);
    return results;
  }

  @GetMapping("/seat-map")
  public Map<String, Object> seatMap(@RequestParam String flightNumber) {
    return Map.of(
        "flight_number", flightNumber,
        "seat_data", Map.of(
            "rows", 24,
            "layout", "ABC-DEF",
            "unavailable", List.of("1A", "1B", "7C", "12D")
        )
    );
  }

  @GetMapping("/ticket")
  public Map<String, Object> ticket(@RequestParam String bookingId) {
    return Map.of("booking_id", bookingId, "document_type", "e-ticket", "status", "ready");
  }
}
