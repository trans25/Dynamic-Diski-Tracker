using Diskie.API.Security;
using Diskie.DataAccess.Model.DbModels;
using Diskie.DataAccess.Model.Models.Common;
using Diskie.DataAccess.Model.Models.Enums;
using Diskie.DataAccess.Model.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Diskie.API.Controllers
{
    [ApiController]
    [Produces("application/json")]
    [Authorize]
    [Route("api/search")]
    public class SearchController : ControllerBase
    {
        private readonly DiskiDbContext _db;
        private readonly ICurrentUserContext _currentUser;

        public SearchController(DiskiDbContext db, ICurrentUserContext currentUser)
        {
            _db = db;
            _currentUser = currentUser;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<GlobalSearchResponseViewModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<GlobalSearchResponseViewModel>>> Get(
            [FromQuery] string q,
            [FromQuery] string type = "all",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] Guid? teamId = null,
            [FromQuery] Guid? clubId = null,
            CancellationToken cancellationToken = default)
        {
            var query = (q ?? string.Empty).Trim();
            if (query.Length < 2)
            {
                return BadRequest(ApiResponse<object>.Fail("Query q must be at least 2 characters.", "400"));
            }

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var tenantId = ResolveTenant(clubId);
            if (tenantId == Guid.Empty)
            {
                return BadRequest(ApiResponse<object>.Fail("Unable to resolve ClubId/TenantId for scoped search.", "400"));
            }

            var like = $"%{query}%";
            var normalizedType = (type ?? "all").Trim().ToLowerInvariant();

            var items = new List<GlobalSearchItemViewModel>();

            if (normalizedType is "all" or "player")
            {
                var playersQuery = _db.Users
                    .Where(u => u.TenantId == tenantId && u.Role == UserRole.Player)
                    .Where(u => EF.Functions.ILike(u.FirstName, like)
                        || EF.Functions.ILike(u.LastName, like)
                        || (u.PreferredPosition != null && EF.Functions.ILike(u.PreferredPosition, like))
                        || (u.Email != null && EF.Functions.ILike(u.Email, like)))
                    .Select(u => new GlobalSearchItemViewModel
                    {
                        Type = "player",
                        Id = u.Id,
                        Title = (u.FirstName + " " + u.LastName).Trim(),
                        Subtitle = u.PreferredPosition ?? "Player",
                        CreatedAt = u.CreatedAt
                    });

                items.AddRange(await playersQuery.Take(100).ToListAsync(cancellationToken));
            }

            if (normalizedType is "all" or "match")
            {
                var fixtureQuery = _db.Fixtures
                    .Where(f => f.Team.TenantId == tenantId && !f.IsTraining)
                    .Where(f => teamId == null || f.TeamId == teamId)
                    .Where(f =>
                        (f.Opponent != null && EF.Functions.ILike(f.Opponent, like))
                        || (f.Venue != null && EF.Functions.ILike(f.Venue, like))
                        || EF.Functions.ILike(f.Team.Name, like)
                        || EF.Functions.ILike(f.Season.Name, like))
                    .Select(f => new GlobalSearchItemViewModel
                    {
                        Type = "match",
                        Id = f.Id,
                        Title = $"{f.Team.Name} vs {(f.Opponent ?? "Opponent")}",
                        Subtitle = $"{f.FixtureDate:yyyy-MM-dd} · {(f.Venue ?? "Venue TBD")}",
                        CreatedAt = f.CreatedAt
                    });

                items.AddRange(await fixtureQuery.Take(100).ToListAsync(cancellationToken));
            }

            var ordered = items
                .OrderByDescending(x => x.CreatedAt)
                .ThenBy(x => x.Title)
                .ToList();

            var totalCount = ordered.Count;
            var paged = ordered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var response = new GlobalSearchResponseViewModel
            {
                Query = query,
                TypeFilter = normalizedType,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = paged
            };

            return Ok(ApiResponse<GlobalSearchResponseViewModel>.Ok(response));
        }

        private Guid ResolveTenant(Guid? requestedClubId)
        {
            if (_currentUser.TenantId != Guid.Empty)
            {
                return _currentUser.TenantId;
            }

            return requestedClubId ?? Guid.Empty;
        }
    }
}
