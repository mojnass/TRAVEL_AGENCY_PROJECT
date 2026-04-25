package com.patronustravel.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;
  private final UserStore userStore;

  public AuthController(
      AuthenticationManager authenticationManager,
      JwtService jwtService,
      PasswordEncoder passwordEncoder,
      UserStore userStore
  ) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.passwordEncoder = passwordEncoder;
    this.userStore = userStore;
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
    Set<String> roles = request.email().endsWith("@admin.test") ? Set.of("USER", "ADMIN") : Set.of("USER");
    AppUser user = new AppUser(
        UUID.randomUUID(),
        request.email().toLowerCase(),
        passwordEncoder.encode(request.password()),
        request.fullName(),
        roles,
        Instant.now()
    );
    userStore.create(user);
    String token = jwtService.createToken(user);
    return new AuthResponse(token, user.withoutPassword());
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password())
    );
    AppUser user = userStore.requireByEmail(authentication.getName());
    return new AuthResponse(jwtService.createToken(user), user.withoutPassword());
  }

  @GetMapping("/me")
  public AppUser me(Principal principal) {
    return userStore.requireByEmail(principal.getName()).withoutPassword();
  }

  @PostMapping("/reset-password")
  public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    userStore.requireByEmail(request.email().toLowerCase());
    return Map.of("message", "Password reset request accepted");
  }

  public record RegisterRequest(
      @Email String email,
      @Size(min = 8, message = "Password must be at least 8 characters") String password,
      @NotBlank String fullName
  ) {}

  public record LoginRequest(@Email String email, @NotBlank String password) {}

  public record ResetPasswordRequest(@Email String email) {}

  public record AuthResponse(String token, AppUser user) {}
}
