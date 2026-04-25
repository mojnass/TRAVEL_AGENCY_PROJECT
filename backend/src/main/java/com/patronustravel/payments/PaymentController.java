package com.patronustravel.payments;

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
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final CatalogStore store;

  public PaymentController(CatalogStore store) {
    this.store = store;
  }

  @GetMapping
  public List<Map<String, Object>> mine(Principal principal) {
    return store.list("payments", Map.of("user_email", principal.getName()));
  }

  @PostMapping("/checkout")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> checkout(Principal principal, @RequestBody Map<String, Object> payload) {
    Map<String, Object> payment = new LinkedHashMap<>(payload);
    payment.put("user_email", principal.getName());
    payment.putIfAbsent("status", "pending");
    payment.putIfAbsent("created_at", Instant.now().toString());
    return store.create("payments", "payment_id", payment);
  }

  @PatchMapping("/{id}/complete")
  public Map<String, Object> complete(@PathVariable String id, @RequestBody(required = false) Map<String, Object> payload) {
    Map<String, Object> payment = store.update("payments", id, Map.of(
        "status", "completed",
        "transaction_id", payload == null ? "mock-transaction" : payload.getOrDefault("transaction_id", "mock-transaction"),
        "paid_at", Instant.now().toString()
    ));
    store.create("invoices", "invoice_id", Map.of("payment_id", id, "invoice_number", invoiceNumber(), "issued_at", Instant.now().toString()));
    return payment;
  }

  @PostMapping("/{id}/refund")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> refund(@PathVariable String id, @RequestBody Map<String, Object> payload) {
    store.update("payments", id, Map.of("status", "refunded", "refunded_at", Instant.now().toString()));
    Map<String, Object> refund = new LinkedHashMap<>(payload);
    refund.put("payment_id", id);
    refund.putIfAbsent("refunded_at", Instant.now().toString());
    return store.create("refunds", "refund_id", refund);
  }

  @GetMapping("/invoices")
  public List<Map<String, Object>> invoices() {
    return store.list("invoices", Map.of());
  }

  private String invoiceNumber() {
    return "INV-" + YearMonth.now().toString().replace("-", "") + "-" + String.format("%04d", new Random().nextInt(10000));
  }
}
