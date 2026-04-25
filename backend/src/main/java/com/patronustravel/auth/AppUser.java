package com.patronustravel.auth;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record AppUser(
    UUID id,
    String email,
    String passwordHash,
    String fullName,
    Set<String> roles,
    Instant createdAt
) {
  public AppUser withoutPassword() {
    return new AppUser(id, email, null, fullName, roles, createdAt);
  }
}
