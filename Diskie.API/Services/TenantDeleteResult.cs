namespace Diskie.API.Services
{
    public enum TenantDeleteResult
    {
        NotFound,
        HasDependents,
        Deleted
    }
}
