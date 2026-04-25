package com.patronustravel.services;

import com.patronustravel.catalog.CatalogStore;
import com.patronustravel.catalog.CrudControllerSupport;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attractions")
public class AttractionController extends CrudControllerSupport {
  public AttractionController(CatalogStore store) {
    super(store, "attractions", "attraction_id");
  }
}
