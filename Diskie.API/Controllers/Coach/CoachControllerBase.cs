using Diskie.API.Authorization;
using Diskie.API.Security;
using Diskie.DataAccess.Model.Models.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.Coach
{
    [ApiController]
    [Produces("application/json")]
    [Authorize(Policy = AuthorizationPolicies.CoachOnly)]
    [Route("api/coach")]
    public abstract class CoachControllerBase : ControllerBase
    {
        protected readonly ICurrentUserContext CurrentUser;

        protected CoachControllerBase(ICurrentUserContext currentUser)
        {
            CurrentUser = currentUser;
        }

        protected ActionResult<ApiResponse<T>> OkResponse<T>(T data, string message = "Success") =>
            Ok(ApiResponse<T>.Ok(data, message));

        protected ActionResult<ApiResponse<T>> CreatedResponse<T>(string actionName, object routeValues, T data) =>
            CreatedAtAction(actionName, routeValues, ApiResponse<T>.Ok(data, "Created", "201"));

        protected ActionResult NotFoundResponse(string message = "Resource not found") =>
            NotFound(ApiResponse<object>.Fail(message, "404"));

        protected ActionResult ForbiddenResponse(string message = "You do not have access to this resource") =>
            StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(message, "403"));
    }
}
