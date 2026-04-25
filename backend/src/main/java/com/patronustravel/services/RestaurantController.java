package com.patronustravel.services;

import com.patronustravel.catalog.CatalogStore;
import com.patronustravel.catalog.CrudControllerSupport;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController extends CrudControllerSupport {
  public RestaurantController(CatalogStore store) {
    super(store, "restaurants", "restaurant_id");
  }
}
