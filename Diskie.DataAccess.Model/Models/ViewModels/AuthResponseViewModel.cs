namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class AuthResponseViewModel
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public DateTime ExpiresAt { get; set; }
        public UserViewModel User { get; set; } = new();
    }
}
