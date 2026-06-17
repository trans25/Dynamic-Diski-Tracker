using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class AttendanceViewModel
    {
        public Guid Id { get; set; }
        public Guid TeamId { get; set; }
        public Guid PlayerId { get; set; }
        public Guid? FixtureId { get; set; }
        public string SessionType { get; set; } = string.Empty;
        public DateOnly SessionDate { get; set; }
        public AttendanceStatus Status { get; set; }
        public string? Notes { get; set; }
        public Guid? RecordedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
