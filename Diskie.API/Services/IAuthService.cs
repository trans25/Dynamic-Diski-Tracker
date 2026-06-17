using Diskie.DataAccess.Model.Models.ViewModels;

namespace Diskie.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseViewModel?> LoginAsync(LoginRequestViewModel model, CancellationToken cancellationToken = default);

        Task<(AuthResponseViewModel? Response, IReadOnlyList<string> Errors)> RegisterAsync(RegisterRequestViewModel model, CancellationToken cancellationToken = default);

        Task<ForgotPasswordResponseViewModel?> ForgotPasswordAsync(ForgotPasswordRequestViewModel model, CancellationToken cancellationToken = default);

        Task<(bool Succeeded, IReadOnlyList<string> Errors)> ResetPasswordAsync(ResetPasswordRequestViewModel model, CancellationToken cancellationToken = default);
    }
}
