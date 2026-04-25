package com.patronustravel.catalog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CatalogStore {
  private static final Pattern IDENTIFIER = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*");

  private final Map<String, Map<String, Map<String, Object>>> tables = new ConcurrentHashMap<>();
  private final ObjectMapper objectMapper;
  private final String dbUrl;
  private final String dbUser;
  private final String dbPassword;
  private final Set<String> compatibilityChecked = ConcurrentHashMap.newKeySet();

  public CatalogStore(
      ObjectMapper objectMapper,
      @Value("${app.supabase.db-url:}") String dbUrl,
      @Value("${app.supabase.db-user:}") String dbUser,
      @Value("${app.supabase.db-password:}") String dbPassword
  ) {
    this.objectMapper = objectMapper;
    this.dbUrl = dbUrl;
    this.dbUser = dbUser;
    this.dbPassword = dbPassword;
  }

  public List<Map<String, Object>> list(String table, Map<String, String> filters) {
    if (shouldUseDatabase(table)) {
      return listFromDatabase(table, filters);
    }
    return table(table).values().stream()
        .filter(item -> matches(item, filters))
        .<Map<String, Object>>map(item -> new LinkedHashMap<String, Object>(item))
        .toList();
  }

  public Map<String, Object> get(String table, String id) {
    if (shouldUseDatabase(table)) {
      return getFromDatabase(table, id);
    }
    Map<String, Object> item = table(table).get(id);
    if (item == null) {
      throw new NoSuchElementException(table + " item not found");
    }
    return new LinkedHashMap<>(item);
  }

  public Map<String, Object> create(String table, String idField, Map<String, Object> payload) {
    if (shouldUseDatabase(table)) {
      return createInDatabase(table, idField, payload);
    }
    Map<String, Object> item = new LinkedHashMap<>(payload);
    String id = valueAsString(item.get(idField));
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
      item.put(idField, id);
    }
    item.putIfAbsent("created_at", Instant.now().toString());
    table(table).put(id, item);
    return new LinkedHashMap<>(item);
  }

  public Map<String, Object> update(String table, String id, Map<String, Object> payload) {
    if (shouldUseDatabase(table)) {
      return updateInDatabase(table, id, payload);
    }
    Map<String, Object> existing = table(table).get(id);
    if (existing == null) {
      throw new NoSuchElementException(table + " item not found");
    }
    existing.putAll(payload);
    existing.put("updated_at", Instant.now().toString());
    return new LinkedHashMap<>(existing);
  }

  public void delete(String table, String id) {
    if (shouldUseDatabase(table)) {
      deleteFromDatabase(table, id);
      return;
    }
    table(table).remove(id);
  }

  public void seed(String table, String idField, List<Map<String, Object>> rows) {
    if (isDatabaseBacked()) {
      return;
    }
    rows.forEach(row -> create(table, idField, row));
  }

  public boolean isDatabaseBacked() {
    return hasText(dbUrl) && hasText(dbUser) && hasText(dbPassword);
  }

  private Map<String, Map<String, Object>> table(String table) {
    return tables.computeIfAbsent(table, ignored -> new ConcurrentHashMap<>());
  }

  private boolean shouldUseDatabase(String table) {
    if (!isDatabaseBacked()) {
      return false;
    }
    if (!tableExists(table)) {
      throw new IllegalStateException("Supabase table does not exist: " + table);
    }
    ensureCompatibility(table);
    return true;
  }

  private boolean matches(Map<String, Object> item, Map<String, String> filters) {
    for (Map.Entry<String, String> filter : filters.entrySet()) {
      if (filter.getValue() == null || filter.getValue().isBlank()) {
        continue;
      }
      Object value = item.get(filter.getKey());
      if (value == null) {
        continue;
      }
      String expected = filter.getValue().toLowerCase();
      String actual = valueAsString(value).toLowerCase();
      if (!actual.contains(expected)) {
        return false;
      }
    }
    return true;
  }

  private String valueAsString(Object value) {
    return value == null ? null : String.valueOf(value);
  }

  public Map<String, Object> stats() {
    if (isDatabaseBacked()) {
      return databaseStats();
    }
    Map<String, Object> stats = new LinkedHashMap<>();
    tables.forEach((name, rows) -> stats.put(name, rows.size()));
    return stats;
  }

  public List<Map<String, Object>> allRows() {
    if (isDatabaseBacked()) {
      List<Map<String, Object>> rows = new ArrayList<>();
      for (String tableName : knownTables()) {
        if (tableExists(tableName)) {
          listFromDatabase(tableName, Map.of()).forEach(row -> {
            row.put("_table", tableName);
            rows.add(row);
          });
        }
      }
      return rows;
    }
    List<Map<String, Object>> rows = new ArrayList<>();
    tables.forEach((table, records) -> records.values().forEach(record -> {
      Map<String, Object> row = new LinkedHashMap<>(record);
      row.put("_table", table);
      rows.add(row);
    }));
    return rows;
  }

  private List<Map<String, Object>> listFromDatabase(String table, Map<String, String> filters) {
    validateIdentifier(table);
    Map<String, ColumnInfo> columns = columns(table);
    List<Map.Entry<String, String>> activeFilters = filters.entrySet().stream()
        .filter(filter -> hasText(filter.getValue()))
        .filter(filter -> columns.containsKey(filter.getKey()))
        .toList();
    String where = activeFilters.isEmpty()
        ? ""
        : activeFilters.stream()
            .map(filter -> quote(filter.getKey()) + "::text ILIKE ?")
            .collect(Collectors.joining(" AND ", " WHERE ", ""));
    String sql = "SELECT * FROM " + quote(table) + where;

    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      for (int i = 0; i < activeFilters.size(); i++) {
        statement.setString(i + 1, "%" + activeFilters.get(i).getValue() + "%");
      }
      try (ResultSet resultSet = statement.executeQuery()) {
        return rows(resultSet);
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not list " + table, exception);
    }
  }

  private Map<String, Object> getFromDatabase(String table, String id) {
    validateIdentifier(table);
    String idField = requireIdField(table);
    String sql = "SELECT * FROM " + quote(table) + " WHERE " + quote(idField) + "::text = ? LIMIT 1";

    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, id);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return row(resultSet);
        }
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not fetch " + table, exception);
    }
    throw new NoSuchElementException(table + " item not found");
  }

  private Map<String, Object> createInDatabase(String table, String idField, Map<String, Object> payload) {
    validateIdentifier(table);
    validateIdentifier(idField);
    Map<String, ColumnInfo> columns = columns(table);
    Map<String, Object> item = new LinkedHashMap<>(payload);
    if (columns.containsKey(idField) && !hasText(valueAsString(item.get(idField)))) {
      item.put(idField, UUID.randomUUID().toString());
    }
    if (columns.containsKey("created_at")) {
      item.putIfAbsent("created_at", Instant.now().toString());
    }

    List<String> insertColumns = item.keySet().stream()
        .filter(columns::containsKey)
        .peek(this::validateIdentifier)
        .toList();
    if (insertColumns.isEmpty()) {
      throw new IllegalArgumentException("No valid columns supplied for " + table);
    }
    String columnSql = insertColumns.stream().map(this::quote).collect(Collectors.joining(", "));
    String valueSql = insertColumns.stream().map(column -> "?").collect(Collectors.joining(", "));
    String sql = "INSERT INTO " + quote(table) + " (" + columnSql + ") VALUES (" + valueSql + ") RETURNING *";

    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      bindValues(statement, insertColumns, columns, item);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return row(resultSet);
        }
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not create " + table, exception);
    }
    throw new IllegalStateException("Create did not return a row");
  }

  private Map<String, Object> updateInDatabase(String table, String id, Map<String, Object> payload) {
    validateIdentifier(table);
    String idField = requireIdField(table);
    Map<String, ColumnInfo> columns = columns(table);
    Map<String, Object> item = new LinkedHashMap<>(payload);
    if (columns.containsKey("updated_at")) {
      item.put("updated_at", Instant.now().toString());
    }
    List<String> updateColumns = item.keySet().stream()
        .filter(columns::containsKey)
        .filter(column -> !column.equals(idField))
        .peek(this::validateIdentifier)
        .toList();
    if (updateColumns.isEmpty()) {
      return getFromDatabase(table, id);
    }
    String setSql = updateColumns.stream()
        .map(column -> quote(column) + " = ?")
        .collect(Collectors.joining(", "));
    String sql = "UPDATE " + quote(table) + " SET " + setSql + " WHERE " + quote(idField) + "::text = ? RETURNING *";

    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      bindValues(statement, updateColumns, columns, item);
      statement.setString(updateColumns.size() + 1, id);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return row(resultSet);
        }
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not update " + table, exception);
    }
    throw new NoSuchElementException(table + " item not found");
  }

  private void deleteFromDatabase(String table, String id) {
    validateIdentifier(table);
    String idField = requireIdField(table);
    String sql = "DELETE FROM " + quote(table) + " WHERE " + quote(idField) + "::text = ?";
    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, id);
      statement.executeUpdate();
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not delete from " + table, exception);
    }
  }

  private Map<String, Object> databaseStats() {
    Map<String, Object> stats = new LinkedHashMap<>();
    for (String tableName : knownTables()) {
      if (!tableExists(tableName)) {
        continue;
      }
      String sql = "SELECT COUNT(*) FROM " + quote(tableName);
      try (Connection connection = connection();
           PreparedStatement statement = connection.prepareStatement(sql);
           ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          stats.put(tableName, resultSet.getLong(1));
        }
      } catch (SQLException exception) {
        throw new IllegalStateException("Could not count " + tableName, exception);
      }
    }
    return stats;
  }

  private boolean tableExists(String table) {
    validateIdentifier(table);
    try (Connection connection = connection();
         ResultSet resultSet = connection.getMetaData().getTables(null, "public", table, new String[]{"TABLE"})) {
      return resultSet.next();
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not inspect table " + table, exception);
    }
  }

  private void ensureCompatibility(String table) {
    if (!compatibilityChecked.add(table)) {
      return;
    }
    if (!"flight_search_cache".equals(table)) {
      return;
    }
    String sql = """
        ALTER TABLE flight_search_cache
          ALTER COLUMN origin DROP NOT NULL,
          ALTER COLUMN destination DROP NOT NULL,
          ALTER COLUMN departure_date DROP NOT NULL,
          ALTER COLUMN return_date DROP NOT NULL,
          ALTER COLUMN passenger_count DROP NOT NULL,
          ALTER COLUMN cabin_class DROP NOT NULL,
          ALTER COLUMN search_results DROP NOT NULL,
          ALTER COLUMN cached_at DROP NOT NULL,
          ALTER COLUMN expires_at DROP NOT NULL
        """;
    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.executeUpdate();
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not update flight_search_cache compatibility", exception);
    }
  }

  private Map<String, ColumnInfo> columns(String table) {
    validateIdentifier(table);
    Map<String, ColumnInfo> columns = new HashMap<>();
    try (Connection connection = connection();
         ResultSet resultSet = connection.getMetaData().getColumns(null, "public", table, null)) {
      while (resultSet.next()) {
        String name = resultSet.getString("COLUMN_NAME");
        columns.put(name, new ColumnInfo(resultSet.getInt("DATA_TYPE"), resultSet.getString("TYPE_NAME")));
      }
    } catch (SQLException exception) {
      throw new IllegalStateException("Could not inspect columns for " + table, exception);
    }
    return columns;
  }

  private String requireIdField(String table) {
    Map<String, ColumnInfo> columns = columns(table);
    for (String candidate : idCandidates(table)) {
      if (columns.containsKey(candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("No known id column found for " + table);
  }

  private Set<String> idCandidates(String table) {
    Set<String> candidates = new HashSet<>();
    candidates.add(table.replaceAll("s$", "") + "_id");
    candidates.add(table.replace("ies", "y").replaceAll("s$", "") + "_id");
    candidates.add("id");
    candidates.add("booking_id");
    candidates.add("bundle_id");
    candidates.add("user_bundle_id");
    candidates.add("payment_id");
    candidates.add("notification_id");
    return candidates;
  }

  private List<String> knownTables() {
    return List.of(
        "flight_offers",
        "flight_search_cache",
        "hotels",
        "hotel_rooms",
        "restaurants",
        "restaurant_tables",
        "attractions",
        "spa_venues",
        "spa_services",
        "bundles",
        "bundle_components",
        "user_bundles",
        "bundle_bookings",
        "bookings",
        "booking_passengers",
        "booking_extras",
        "booking_status_history",
        "payments",
        "invoices",
        "refunds",
        "notifications"
    );
  }

  private void bindValues(
      PreparedStatement statement,
      List<String> names,
      Map<String, ColumnInfo> columns,
      Map<String, Object> values
  ) throws SQLException {
    for (int i = 0; i < names.size(); i++) {
      String name = names.get(i);
      statement.setObject(i + 1, databaseValue(values.get(name), columns.get(name)));
    }
  }

  private Object databaseValue(Object value, ColumnInfo column) throws SQLException {
    if (value == null) {
      return null;
    }
    if ("uuid".equals(column.typeName())) {
      return UUID.fromString(String.valueOf(value));
    }
    if ("json".equals(column.typeName()) || "jsonb".equals(column.typeName())) {
      PGobject json = new PGobject();
      json.setType(column.typeName());
      try {
        json.setValue(value instanceof String stringValue ? stringValue : objectMapper.writeValueAsString(value));
      } catch (JsonProcessingException exception) {
        throw new SQLException("Could not serialize JSON value", exception);
      }
      return json;
    }
    if (column.sqlType() == Types.TIMESTAMP || column.sqlType() == Types.TIMESTAMP_WITH_TIMEZONE) {
      return Timestamp.from(Instant.parse(String.valueOf(value)));
    }
    if (column.sqlType() == Types.DATE) {
      return Date.valueOf(String.valueOf(value));
    }
    return value;
  }

  private List<Map<String, Object>> rows(ResultSet resultSet) throws SQLException {
    List<Map<String, Object>> rows = new ArrayList<>();
    while (resultSet.next()) {
      rows.add(row(resultSet));
    }
    return rows;
  }

  private Map<String, Object> row(ResultSet resultSet) throws SQLException {
    ResultSetMetaData metaData = resultSet.getMetaData();
    Map<String, Object> row = new LinkedHashMap<>();
    for (int i = 1; i <= metaData.getColumnCount(); i++) {
      Object value = resultSet.getObject(i);
      row.put(metaData.getColumnLabel(i), responseValue(value));
    }
    return row;
  }

  private Object responseValue(Object value) {
    if (value instanceof Timestamp timestamp) {
      return timestamp.toInstant().toString();
    }
    if (value instanceof Date date) {
      return date.toString();
    }
    if (value instanceof PGobject object) {
      return object.getValue();
    }
    return value;
  }

  private Connection connection() throws SQLException {
    return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private void validateIdentifier(String identifier) {
    if (!IDENTIFIER.matcher(identifier).matches()) {
      throw new IllegalArgumentException("Invalid database identifier: " + identifier);
    }
  }

  private String quote(String identifier) {
    validateIdentifier(identifier);
    return "\"" + identifier + "\"";
  }

  private record ColumnInfo(int sqlType, String typeName) {}
}
