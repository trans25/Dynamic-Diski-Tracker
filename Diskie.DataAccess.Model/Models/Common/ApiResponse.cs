namespace Diskie.DataAccess.Model.Models.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string message = "Success", string code = "200") =>
            new() { Success = true, Data = data, Message = message, Code = code };

        public static ApiResponse<T> Fail(string message, string code = "400") =>
            new() { Success = false, Message = message, Code = code };
    }
}
