package com.patronustravel.admin;

import com.patronustravel.auth.UserStore;
import com.patronustravel.catalog.CatalogStore;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final CatalogStore store;
  private final UserStore userStore;

  public AdminController(CatalogStore store, UserStore userStore) {
    this.store = store;
    this.userStore = userStore;
  }

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    return Map.of(
        "users", userStore.allUsers().size(),
        "tables", store.stats()
    );
  }

  @GetMapping("/users")
  public Object users() {
    return userStore.allUsers();
  }

  @GetMapping("/records")
  public Object records() {
    return store.allRows();
  }
}
