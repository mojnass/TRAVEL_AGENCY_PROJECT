package com.patronustravel.services;

import com.patronustravel.catalog.CatalogStore;
import com.patronustravel.catalog.CrudControllerSupport;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hotels")
public class HotelController extends CrudControllerSupport {
  public HotelController(CatalogStore store) {
    super(store, "hotels", "hotel_id");
  }
}
