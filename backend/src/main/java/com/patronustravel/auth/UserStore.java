package com.patronustravel.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserStore implements UserDetailsService {
  private final Map<String, AppUser> usersByEmail = new ConcurrentHashMap<>();
  private final String dbUrl;
  private final String dbUser;
  private final String dbPassword;

  public UserStore(
      @Value("${app.supabase.db-url:}") String dbUrl,
      @Value("${app.supabase.db-user:}") String dbUser,
      @Value("${app.supabase.db-password:}") String dbPassword
  ) {
    this.dbUrl = dbUrl;
    this.dbUser = dbUser;
    this.dbPassword = dbPassword;
  }

  public AppUser create(AppUser user) {
    if (isDatabaseBacked()) {
      return createInDatabase(user);
    }
    AppUser existing = usersByEmail.putIfAbsent(user.email(), user);
    if (existing != null) {
      throw new IllegalArgumentException("Email is already registered");
    }
    return user;
  }

  public AppUser requireByEmail(String email) {
    if (isDatabaseBacked()) {
      return requireByEmailFromDatabase(email);
    }
    AppUser user = usersByEmail.get(email.toLowerCase());
    if (user == null) {
      throw new UsernameNotFoundException("User not found");
    }
    return user;
  }

  public Collection<AppUser> allUsers() {
    if (isDatabaseBacked()) {
      return allUsersFromDatabase();
    }
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

  private AppUser createInDatabase(AppUser user) {
    if (findByEmail(user.email()) != null) {
      throw new IllegalArgumentException("Email is already registered");
    }

    String sql = """
        insert into app_users (user_id, email, password_hash, full_name, roles, created_at)
        values (?, ?, ?, ?, ?, ?)
        """;

    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setObject(1, user.id());
      statement.setString(2, user.email());
      statement.setString(3, user.passwordHash());
      statement.setString(4, user.fullName());
      statement.setString(5, String.join(",", user.roles()));
      statement.setTimestamp(6, Timestamp.from(user.createdAt()));
      statement.executeUpdate();
      return user;
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not create user", exception);
    }
  }

  private AppUser requireByEmailFromDatabase(String email) {
    AppUser user = findByEmail(email);
    if (user == null) {
      throw new UsernameNotFoundException("User not found");
    }
    return user;
  }

  private AppUser findByEmail(String email) {
    String sql = "select * from app_users where email = ?";
    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, email.toLowerCase());
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return userFromRow(resultSet);
        }
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not fetch user", exception);
    }
    return null;
  }

  private Collection<AppUser> allUsersFromDatabase() {
    String sql = "select * from app_users order by created_at desc";
    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql);
         ResultSet resultSet = statement.executeQuery()) {
      Collection<AppUser> users = new java.util.ArrayList<>();
      while (resultSet.next()) {
        users.add(userFromRow(resultSet).withoutPassword());
      }
      return users;
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not fetch users", exception);
    }
  }

  private AppUser userFromRow(ResultSet resultSet) throws SQLException {
    String roles = resultSet.getString("roles");
    Set<String> parsedRoles = roles == null || roles.isBlank()
        ? Set.of("USER")
        : new LinkedHashSet<>(Arrays.asList(roles.split(",")));
    return new AppUser(
        resultSet.getObject("user_id", UUID.class),
        resultSet.getString("email"),
        resultSet.getString("password_hash"),
        resultSet.getString("full_name"),
        parsedRoles,
        instant(resultSet.getTimestamp("created_at"))
    );
  }

  private Instant instant(Timestamp timestamp) {
    return timestamp == null ? Instant.now() : timestamp.toInstant();
  }

  private boolean isDatabaseBacked() {
    return hasText(dbUrl) && hasText(dbUser) && hasText(dbPassword);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private Connection connection() throws SQLException {
    return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
  }
}
