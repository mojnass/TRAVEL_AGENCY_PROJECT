package com.patronustravel.catalog;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.List;

public abstract class CrudControllerSupport {
  protected final CatalogStore store;
  private final String table;
  private final String idField;

  protected CrudControllerSupport(CatalogStore store, String table, String idField) {
    this.store = store;
    this.table = table;
    this.idField = idField;
  }

  @GetMapping
  public List<Map<String, Object>> list(@RequestParam Map<String, String> filters) {
    return store.list(table, filters);
  }

  @GetMapping("/search")
  public List<Map<String, Object>> search(@RequestParam Map<String, String> filters) {
    return store.list(table, filters);
  }

  @GetMapping("/{id}")
  public Map<String, Object> get(@PathVariable String id) {
    return store.get(table, id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> create(@RequestBody Map<String, Object> payload) {
    return store.create(table, idField, payload);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public Map<String, Object> update(@PathVariable String id, @RequestBody Map<String, Object> payload) {
    return store.update(table, id, payload);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasRole('ADMIN')")
  public void delete(@PathVariable String id) {
    store.delete(table, id);
  }
}
