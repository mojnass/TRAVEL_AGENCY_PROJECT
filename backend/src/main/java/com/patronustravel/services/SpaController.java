package com.patronustravel.services;

import com.patronustravel.catalog.CatalogStore;
import com.patronustravel.catalog.CrudControllerSupport;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/spa")
public class SpaController extends CrudControllerSupport {
  public SpaController(CatalogStore store) {
    super(store, "spa_venues", "spa_id");
  }
}
