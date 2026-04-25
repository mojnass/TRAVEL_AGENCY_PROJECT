package com.patronustravel.auth;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserStore implements UserDetailsService {
  private final Map<String, AppUser> usersByEmail = new ConcurrentHashMap<>();

  public AppUser create(AppUser user) {
    AppUser existing = usersByEmail.putIfAbsent(user.email(), user);
    if (existing != null) {
      throw new IllegalArgumentException("Email is already registered");
    }
    return user;
  }

  public AppUser requireByEmail(String email) {
    AppUser user = usersByEmail.get(email.toLowerCase());
    if (user == null) {
      throw new UsernameNotFoundException("User not found");
    }
    return user;
  }

  public Collection<AppUser> allUsers() {
    return usersByEmail.values().stream().map(AppUser::withoutPassword).toList();
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    AppUser user = requireByEmail(username);
    return User
        .withUsername(user.email())
        .password(user.passwordHash())
        .roles(user.roles().toArray(String[]::new))
        .build();
  }
}
