namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class ParentMagicLinkRequestViewModel
    {
        public string ChildIdNumber { get; set; } = string.Empty;
    }

    public class ParentMagicLinkResponseViewModel
    {
        public string? MagicLink { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class ParentMagicTokenExchangeRequestViewModel
    {
        public string Token { get; set; } = string.Empty;
    }

    public class ParentAuthResponseViewModel
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public DateTime ExpiresAt { get; set; }
        public string ChildId { get; set; } = string.Empty;
        public string? ChildName { get; set; }
    }
}
