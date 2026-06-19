using System.Security.Claims;
using Diskie.API.Authorization;
using Diskie.DataAccess.Model.Models.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Diskie.API.Controllers.SystemAdmin
{
    [ApiController]
    [Produces("application/json")]
    [Authorize(Policy = AuthorizationPolicies.SuperAdminOnly)]
    public abstract class SuperAdminControllerBase : ControllerBase
    {
        protected Guid? CurrentUserId =>
            Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

        protected ActionResult<ApiResponse<T>> OkResponse<T>(T data, string message = "Success") =>
            Ok(ApiResponse<T>.Ok(data, message));

        protected ActionResult<ApiResponse<T>> CreatedResponse<T>(string actionName, object routeValues, T data) =>
            CreatedAtAction(actionName, routeValues, ApiResponse<T>.Ok(data, "Created", "201"));

        protected ActionResult NotFoundResponse(string message = "Resource not found") =>
            NotFound(ApiResponse<object>.Fail(message, "404"));

        protected ActionResult ConflictResponse(string message = "Request conflicts with the current state of the resource") =>
            Conflict(ApiResponse<object>.Fail(message, "409"));
    }
}
