package com.patronustravel.notifications;

import com.patronustravel.catalog.CatalogStore;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
  private final CatalogStore store;

  public NotificationController(CatalogStore store) {
    this.store = store;
  }

  @GetMapping
  public List<Map<String, Object>> mine(Principal principal) {
    return store.list("notifications", Map.of("user_email", principal.getName()));
  }

  @GetMapping("/unread-count")
  public Map<String, Object> unreadCount(Principal principal) {
    long unread = mine(principal).stream().filter(item -> !Boolean.TRUE.equals(item.get("is_read"))).count();
    return Map.of("unread_count", unread);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> create(Principal principal, @RequestBody Map<String, Object> payload) {
    Map<String, Object> notification = new LinkedHashMap<>(payload);
    notification.putIfAbsent("user_email", principal.getName());
    notification.putIfAbsent("is_read", false);
    notification.putIfAbsent("created_at", Instant.now().toString());
    return store.create("notifications", "notification_id", notification);
  }

  @PatchMapping("/{id}/read")
  public Map<String, Object> markRead(@PathVariable String id) {
    return store.update("notifications", id, Map.of("is_read", true));
  }
}
