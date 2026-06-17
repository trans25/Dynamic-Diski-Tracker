using Diskie.DataAccess.Model.DbModels;

namespace Diskie.API.Services
{
    public interface ITokenService
    {
        (string Token, DateTime ExpiresAt) GenerateToken(User user);
    }
}
