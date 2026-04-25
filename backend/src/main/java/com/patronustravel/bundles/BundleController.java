package com.patronustravel.bundles;

import com.patronustravel.catalog.CatalogStore;
import com.patronustravel.catalog.CrudControllerSupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bundles")
public class BundleController extends CrudControllerSupport {
  public BundleController(CatalogStore store) {
    super(store, "bundles", "bundle_id");
  }

  @GetMapping("/published")
  public List<Map<String, Object>> published() {
    return store.list("bundles", Map.of("status", "published"));
  }

  @GetMapping("/mine")
  public List<Map<String, Object>> mine(Principal principal) {
    return store.list("user_bundles", Map.of("user_email", principal.getName()));
  }

  @PostMapping("/compose")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> compose(Principal principal, @RequestBody Map<String, Object> payload) {
    Map<String, Object> userBundle = new LinkedHashMap<>(payload);
    userBundle.put("user_email", principal.getName());
    userBundle.putIfAbsent("shareable_link", UUID.randomUUID().toString().substring(0, 12));
    return store.create("user_bundles", "user_bundle_id", userBundle);
  }

  @GetMapping("/share/{shareableLink}")
  public Map<String, Object> shared(@PathVariable String shareableLink) {
    return store.list("user_bundles", Map.of("shareable_link", shareableLink)).stream()
        .findFirst()
        .orElseThrow();
  }

  @PostMapping("/{id}/components")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> addComponent(@PathVariable String id, @RequestBody Map<String, Object> payload) {
    Map<String, Object> component = new LinkedHashMap<>(payload);
    component.put("bundle_id", id);
    return store.create("bundle_components", "component_id", component);
  }

  @GetMapping("/{id}/itinerary")
  public Map<String, Object> itinerary(@PathVariable String id) {
    return Map.of("bundle_id", id, "document_type", "pdf-itinerary", "status", "ready");
  }
}
