namespace Diskie.API.Authorization
{
    public static class AuthorizationPolicies
    {
        public const string SuperAdminOnly = nameof(SuperAdminOnly);
        public const string PlatformManagement = nameof(PlatformManagement);
        public const string CoachOnly = nameof(CoachOnly);
    }
}
