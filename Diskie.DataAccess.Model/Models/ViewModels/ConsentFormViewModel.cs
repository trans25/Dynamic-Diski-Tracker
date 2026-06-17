namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class ConsentFormViewModel
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid? SeasonId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? FormContent { get; set; }
        public string? Purpose { get; set; }
        public bool IsMandatory { get; set; }
        public bool RequiresSignature { get; set; }
        public string? SignatureType { get; set; }
        public DateOnly? ExpiresAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
