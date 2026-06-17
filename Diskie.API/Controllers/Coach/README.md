# Coach Module

Tenant-scoped backend module for the **Coach** role in the multi-tenant Diski platform.

## Security & Tenant Isolation

- All endpoints require a JWT and the `Coach` role via the `CoachOnly` authorization policy.
- The tenant and user identity are **always** derived from JWT claims (`tenant_id`, `NameIdentifier`)
  through `ICurrentUserContext`. Request bodies never supply a tenant id.
- Entities without a direct `TenantId` (e.g. `Injury`, `TeamPlayer`) are filtered by joining through
  `Team`/`TeamCoach`, so a coach can only read data for teams they are assigned to within their tenant.

## Endpoints

| Method | Route                                 | Description                                  |
|--------|---------------------------------------|----------------------------------------------|
| GET    | `/api/coach/dashboard`                | Summary counts, teams, upcoming fixtures, recent announcements |
| GET    | `/api/coach/teams`                    | Teams assigned to the current coach          |
| GET    | `/api/coach/teams/{teamId}/roster`    | Roster for an assigned team                  |
| GET    | `/api/coach/schedule/upcoming`        | Upcoming fixtures for the coach's teams      |
| GET    | `/api/coach/schedule/history?teamId=` | Past matches (optionally filtered by team)   |
| GET    | `/api/coach/injuries?teamId=`         | Injuries for the coach's players             |
| GET    | `/api/coach/announcements`            | Tenant announcements                         |
| POST   | `/api/coach/announcements`            | Create a tenant/team announcement            |

All responses use the standard `ApiResponse<T>` envelope.

## Authentication (ASP.NET Identity)

Authentication is backed by **ASP.NET Identity** registered via `AddIdentityCore<User>`, while **JWT bearer
remains the default authentication scheme** for the API (so no cookie auth is introduced).

- `User` derives from `IdentityUser<Guid>` (inherited `Email`, `UserName`, `PasswordHash`), keeping the
  custom `Role`, `TenantId`, and profile fields plus `CreatedAt`/`UpdatedAt`.
- `DiskiDbContext` derives from `IdentityDbContext<User, IdentityRole<Guid>, Guid>`, producing the standard
  `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, etc. tables.
- Passwords are hashed and verified by `UserManager<User>`; login still returns a JWT via `ITokenService`.
- Identity roles are seeded to match the `UserRole` enum (`SuperAdmin`, `SchoolAdmin`, `Coach`, `Player`,
  `Guardian`).

The Coach controllers/services and tenant-isolation logic depend only on `ICurrentUserContext` (JWT claims),
so they were unaffected by the Identity migration.

## Seeded Development Data

On Development startup, `CoachModuleSeeder` creates two tenants so isolation can be verified:

| User                   | Password    | Tenant                     | Team       |
|------------------------|-------------|----------------------------|------------|
| `coach.a@diskie.dev`   | `Coach@123` | Springfield Sports Academy | U15 Boys   |
| `coach.b@diskie.dev`   | `Coach@123` | Gotham United FC           | U17 Girls  |

`player.a@diskie.dev` is rostered on Tenant A's U15 Boys team.

> Note: the seeder uses `EnsureCreatedAsync`. If the schema changes (as it did when Identity was added),
> drop the database first (`dotnet ef database drop --force`) so it is recreated with the new schema.

## Sample Requests

Login (returns a JWT containing `tenant_id` and `Coach` role):

```bash
curl -X POST http://localhost:5054/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "coach.a@diskie.dev", "password": "Coach@123" }'
```

Use the returned token:

```bash
TOKEN="<paste access token>"

curl http://localhost:5054/api/coach/dashboard -H "Authorization: Bearer $TOKEN"
curl http://localhost:5054/api/coach/teams     -H "Authorization: Bearer $TOKEN"
```

Create an announcement:

```bash
curl -X POST http://localhost:5054/api/coach/announcements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Practice moved", "body": "Now 4pm Friday", "audience": "Team", "priority": "Important", "channel": "Push" }'
```

## Negative Tenant-Isolation Tests

These verify a coach cannot reach another tenant's data. Log in as **Coach A**, then attempt to access **Tenant B** resources.

1. **Cross-tenant roster** — request Tenant B's team roster with Coach A's token.
   Expect `404 Not Found` (`"Team not found or not assigned to you"`):

   ```bash
   curl -i http://localhost:5054/api/coach/teams/<TENANT_B_TEAM_ID>/roster \
	 -H "Authorization: Bearer $TOKEN_A"
   ```

2. **Cross-tenant match history** — pass Tenant B's team id as a filter.
   Expect `200 OK` with an **empty** data array (no leakage):

   ```bash
   curl -i "http://localhost:5054/api/coach/schedule/history?teamId=<TENANT_B_TEAM_ID>" \
	 -H "Authorization: Bearer $TOKEN_A"
   ```

3. **Cross-tenant injuries** — same idea against the injuries endpoint.
   Expect `200 OK` with an empty array:

   ```bash
   curl -i "http://localhost:5054/api/coach/injuries?teamId=<TENANT_B_TEAM_ID>" \
	 -H "Authorization: Bearer $TOKEN_A"
   ```

4. **Announcement for another tenant's team** — try to post to a Tenant B team.
   Expect `400 Bad Request` (`"Team not found or not assigned to you"`):

   ```bash
   curl -i -X POST http://localhost:5054/api/coach/announcements \
	 -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
	 -d '{ "teamId": "<TENANT_B_TEAM_ID>", "title": "x", "body": "y", "audience": "Team", "priority": "Normal", "channel": "Push" }'
   ```

5. **No token / wrong role** — call any endpoint without a token or with a non-coach token.
   Expect `401 Unauthorized` / `403 Forbidden`.
