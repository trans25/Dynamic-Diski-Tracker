using System.Security.Claims;

namespace Diskie.API.Security
{
    /// <summary>
    /// Provides the tenant and user scope for the current request, sourced exclusively
    /// from the authenticated JWT claims. Request bodies must never supply tenant ids;
    /// they are always derived here to guarantee tenant isolation.
    /// </summary>
    public interface ICurrentUserContext
    {
        Guid UserId { get; }
        Guid TenantId { get; }
        string? Role { get; }
        bool HasTenant { get; }
    }

    public class CurrentUserContext : ICurrentUserContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserContext(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

        public Guid UserId =>
            Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
                ? id
                : Guid.Empty;

        public Guid TenantId =>
            Guid.TryParse(Principal?.FindFirst("tenant_id")?.Value, out var id)
                ? id
                : Guid.Empty;

        public string? Role => Principal?.FindFirstValue(ClaimTypes.Role);

        public bool HasTenant => TenantId != Guid.Empty;
    }
}
