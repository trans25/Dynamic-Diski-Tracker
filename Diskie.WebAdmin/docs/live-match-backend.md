# Live Match Backend Blueprint (ASP.NET Core + Postgres)

This blueprint matches your LiveMatch UI behavior:

1. Big scoreboard (Home X - Y Away)
2. 90-minute countdown clock
3. Event buttons: + Goal, + Assist, Yellow Card
4. Event POST persists to Postgres
5. Frontend updates instantly via optimistic state

## 1) API contract

### GET /api/matches/{id}
Returns complete live state.

```json
{
  "id": "match-123",
  "homeTeamName": "Home",
  "awayTeamName": "Away",
  "homeScore": 2,
  "awayScore": 1,
  "clockSecondsRemaining": 3240,
  "formation": "4-3-3",
  "status": "Live",
  "events": [
    {
      "id": "evt-1",
      "matchId": "match-123",
      "playerId": "p-9",
      "playerName": "S. Mkhize",
      "kind": "Goal",
      "side": "home",
      "minute": 37,
      "createdAt": "2026-06-18T09:00:00Z"
    }
  ],
  "players": [
    {
      "playerId": "p-9",
      "playerName": "S. Mkhize",
      "goals": 1,
      "assists": 0,
      "yellowCards": 0,
      "metricScore": 62
    }
  ]
}
```

### POST /api/matches/{id}/events
Payload:

```json
{
  "playerId": "p-9",
  "playerName": "S. Mkhize",
  "kind": "Goal",
  "side": "home",
  "minute": 38
}
```

Response (saved event):

```json
{
  "id": "evt-2",
  "matchId": "match-123",
  "playerId": "p-9",
  "playerName": "S. Mkhize",
  "kind": "Goal",
  "side": "home",
  "minute": 38,
  "createdAt": "2026-06-18T09:02:00Z"
}
```

## 2) Postgres tables

```sql
create table matches (
  id uuid primary key,
  home_team_name text not null,
  away_team_name text not null,
  home_score int not null default 0,
  away_score int not null default 0,
  clock_seconds_remaining int not null default 5400,
  formation text not null default '4-3-3',
  status text not null default 'Live', -- Live, Paused, Finished
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table match_players (
  id uuid primary key,
  match_id uuid not null references matches(id) on delete cascade,
  player_id text not null,
  player_name text not null,
  goals int not null default 0,
  assists int not null default 0,
  yellow_cards int not null default 0,
  metric_score int not null default 50,
  unique (match_id, player_id)
);

create table match_events (
  id uuid primary key,
  match_id uuid not null references matches(id) on delete cascade,
  player_id text not null,
  player_name text not null,
  kind text not null, -- Goal, Assist, YellowCard
  side text not null, -- home, away
  minute int not null,
  created_by text null,
  created_at timestamptz not null default now()
);

create index ix_match_events_match_created
  on match_events(match_id, created_at desc);
```

## 3) EF entities (minimal)

```csharp
public sealed class Match
{
    public Guid Id { get; set; }
    public string HomeTeamName { get; set; } = string.Empty;
    public string AwayTeamName { get; set; } = string.Empty;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public int ClockSecondsRemaining { get; set; } = 5400;
    public string Formation { get; set; } = "4-3-3";
    public string Status { get; set; } = "Live";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<MatchEvent> Events { get; set; } = new();
    public List<MatchPlayerStats> Players { get; set; } = new();
}

public sealed class MatchEvent
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Side { get; set; } = string.Empty;
    public int Minute { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class MatchPlayerStats
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int YellowCards { get; set; }
    public int MetricScore { get; set; } = 50;
}
```

## 4) Request/response DTOs

```csharp
public sealed class CreateMatchEventRequest
{
    public string PlayerId { get; init; } = string.Empty;
    public string PlayerName { get; init; } = string.Empty;
    public string Kind { get; init; } = string.Empty; // Goal, Assist, YellowCard
    public string Side { get; init; } = string.Empty; // home, away
    public int Minute { get; init; }
}

public sealed class MatchEventViewModel
{
    public string Id { get; init; } = string.Empty;
    public string MatchId { get; init; } = string.Empty;
    public string PlayerId { get; init; } = string.Empty;
    public string PlayerName { get; init; } = string.Empty;
    public string Kind { get; init; } = string.Empty;
    public string Side { get; init; } = string.Empty;
    public int Minute { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}
```

## 5) Domain update logic

When event is recorded:

1. Insert event row in match_events
2. Update match_players counters by kind
3. Recompute metric score per player
4. If kind is Goal, increment matches.home_score or matches.away_score
5. Commit transaction

Metric example:

```text
metricScore = min(100, max(0, 50 + goals*12 + assists*8 - yellowCards*5))
```

## 6) Service implementation skeleton

```csharp
public interface IMatchService
{
    Task<LiveMatchViewModel> GetLiveMatchAsync(Guid matchId, CancellationToken ct = default);
    Task<MatchEventViewModel> AddMatchEventAsync(Guid matchId, CreateMatchEventRequest request, string? actorId, CancellationToken ct = default);
}

public sealed class MatchService : IMatchService
{
    private readonly AppDbContext _db;

    public MatchService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<LiveMatchViewModel> GetLiveMatchAsync(Guid matchId, CancellationToken ct = default)
    {
        var match = await _db.Matches
            .Include(m => m.Events.OrderByDescending(e => e.CreatedAt))
            .Include(m => m.Players)
            .SingleAsync(m => m.Id == matchId, ct);

        // Map to ViewModel
        return Map(match);
    }

    public async Task<MatchEventViewModel> AddMatchEventAsync(Guid matchId, CreateMatchEventRequest request, string? actorId, CancellationToken ct = default)
    {
        using var tx = await _db.Database.BeginTransactionAsync(ct);

        var match = await _db.Matches.SingleAsync(m => m.Id == matchId, ct);
        var player = await _db.MatchPlayers.SingleAsync(p => p.MatchId == matchId && p.PlayerId == request.PlayerId, ct);

        var evt = new MatchEvent
        {
            Id = Guid.NewGuid(),
            MatchId = matchId,
            PlayerId = request.PlayerId,
            PlayerName = request.PlayerName,
            Kind = request.Kind,
            Side = request.Side,
            Minute = request.Minute,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.MatchEvents.Add(evt);

        if (request.Kind == "Goal")
        {
            player.Goals += 1;
            if (request.Side == "home") match.HomeScore += 1;
            if (request.Side == "away") match.AwayScore += 1;
        }
        else if (request.Kind == "Assist")
        {
            player.Assists += 1;
        }
        else if (request.Kind == "YellowCard")
        {
            player.YellowCards += 1;
        }

        player.MetricScore = Math.Clamp(50 + player.Goals * 12 + player.Assists * 8 - player.YellowCards * 5, 0, 100);
        match.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return new MatchEventViewModel
        {
            Id = evt.Id.ToString(),
            MatchId = evt.MatchId.ToString(),
            PlayerId = evt.PlayerId,
            PlayerName = evt.PlayerName,
            Kind = evt.Kind,
            Side = evt.Side,
            Minute = evt.Minute,
            CreatedAt = evt.CreatedAt
        };
    }

    private static LiveMatchViewModel Map(Match match)
    {
        // Implement mapping to frontend contract
        throw new NotImplementedException();
    }
}
```

## 7) Controller

```csharp
[ApiController]
[Route("api/matches")]
[Authorize(Roles = "Coach,SchoolAdmin,SuperAdmin")]
public sealed class MatchesController : ControllerBase
{
    private readonly IMatchService _service;

    public MatchesController(IMatchService service)
    {
        _service = service;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LiveMatchViewModel>> Get(Guid id, CancellationToken ct)
    {
        var vm = await _service.GetLiveMatchAsync(id, ct);
        return Ok(vm);
    }

    [HttpPost("{id:guid}/events")]
    public async Task<ActionResult<MatchEventViewModel>> PostEvent(Guid id, [FromBody] CreateMatchEventRequest request, CancellationToken ct)
    {
        var actorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var vm = await _service.AddMatchEventAsync(id, request, actorId, ct);
        return Ok(vm);
    }
}
```

## 8) Clock strategy

Keep server as source of truth:

- Persist clock_seconds_remaining in matches
- Optionally add endpoint for clock tick/pauses
- Frontend may tick locally every second, but refetch after event post to stay in sync

## 9) Concurrency safety

- Wrap event insert and score/stat updates in one DB transaction
- Use row-level locks if you expect simultaneous coach actions
- Add optimistic concurrency token (xmin/rowversion style) if needed

## 10) Frontend alignment

Your frontend already calls:

- GET /matches/{id}
- POST /matches/{id}/events

and now uses optimistic updates with temp event correlation and server revalidation after mutation.
