package com.patronustravel.booking;

import com.patronustravel.catalog.CatalogStore;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
  private final CatalogStore store;

  public BookingController(CatalogStore store) {
    this.store = store;
  }

  @GetMapping
  public List<Map<String, Object>> myBookings(Principal principal, @RequestParam Map<String, String> filters) {
    filters.put("user_email", principal.getName());
    return store.list("bookings", filters);
  }

  @GetMapping("/{id}")
  public Map<String, Object> get(@PathVariable String id) {
    return store.get("bookings", id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> create(Principal principal, @RequestBody Map<String, Object> payload) {
    Map<String, Object> booking = new LinkedHashMap<>(payload);
    booking.put("user_email", principal.getName());
    booking.putIfAbsent("status", "pending");
    booking.putIfAbsent("created_at", Instant.now().toString());
    Map<String, Object> created = store.create("bookings", "booking_id", booking);
    addHistory(String.valueOf(created.get("booking_id")), String.valueOf(created.get("status")), principal.getName());
    return created;
  }

  @PatchMapping("/{id}/status")
  public Map<String, Object> updateStatus(Principal principal, @PathVariable String id, @RequestBody Map<String, Object> payload) {
    String status = String.valueOf(payload.getOrDefault("status", "pending"));
    Map<String, Object> updated = store.update("bookings", id, Map.of("status", status));
    addHistory(id, status, principal.getName());
    return updated;
  }

  @PostMapping("/{id}/passengers")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> addPassenger(@PathVariable String id, @RequestBody Map<String, Object> payload) {
    Map<String, Object> passenger = new LinkedHashMap<>(payload);
    passenger.put("booking_id", id);
    return store.create("booking_passengers", "passenger_id", passenger);
  }

  @PostMapping("/{id}/extras")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> addExtra(@PathVariable String id, @RequestBody Map<String, Object> payload) {
    Map<String, Object> extra = new LinkedHashMap<>(payload);
    extra.put("booking_id", id);
    return store.create("booking_extras", "extra_id", extra);
  }

  private void addHistory(String bookingId, String status, String changedBy) {
    store.create("booking_status_history", "history_id", Map.of(
        "booking_id", bookingId,
        "status", status,
        "changed_by", changedBy,
        "changed_at", Instant.now().toString()
    ));
  }
}
