# Travel Agency Backend

Spring Boot backend for the team split in the project prompt.

## Modules Covered

- Mohammad Jaafar: Auth endpoints and Spring Security JWT foundation.
- Tala Daouk: Flights, flight search cache, seat maps, and e-ticket payload generation.
- Jad Al Btaddini: Hotels, restaurants, attractions, and spa CRUD/search APIs.
- Mojtaba Nasserddine: Bundles, checkout, payments, invoices, refunds, and itinerary payload generation.
- Mohamad Kaddah: Dashboard, notifications, admin listings, and test coordination starter coverage.

## Run

Install Java 21 and Maven, then:

```bash
cd backend
mvn spring-boot:run
```

The API runs on `http://localhost:8080`.

## Supabase

Local secrets live in `backend/.env`, which is ignored by git. Use these names:

```env
SUPABASE_URL=https://qruqxvfczdvbshzvjcii.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_DB_URL=jdbc:postgresql://db.qruqxvfczdvbshzvjcii.supabase.co:5432/postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password
```

The Supabase dashboard shows the database connection string as `postgresql://...`; Spring Boot needs the JDBC form, which starts with `jdbc:postgresql://...`.

Before using the database-backed API, run [sql/supabase-schema.sql](sql/supabase-schema.sql) in the Supabase SQL Editor. Once `SUPABASE_DB_PASSWORD` is set, the backend reads/writes these Supabase tables instead of the local in-memory demo store.

On this Windows workspace, Java 21 is installed at:

```powershell
C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot
```

If `java` or `mvn` are not on PATH in a fresh terminal, use the local Maven download from the repo root:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
$repo='C:\Users\USP\Desktop\website\TRAVEL_AGENCY_PROJECT\.m2\repository'
cd backend
..\.tools\apache-maven-3.9.9\bin\mvn.cmd "-Dmaven.repo.local=$repo" test
```

## Auth

Register:

```http
POST /api/auth/register
```

Login:

```http
POST /api/auth/login
```

Send authenticated requests with:

```http
Authorization: Bearer <token>
```

For local demo admin access, register with an email ending in `@admin.test`.
