namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class ForgotPasswordResponseViewModel
    {
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Password reset token. In production this should be emailed to the user
        /// rather than returned in the response. It is surfaced here so the reset
        /// flow can be exercised without an email provider configured.
        /// </summary>
        public string ResetToken { get; set; } = string.Empty;
    }
}
