using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateAttendanceViewModel
    {
        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public Guid PlayerId { get; set; }

        public Guid? FixtureId { get; set; }

        [Required]
        [StringLength(50)]
        public string SessionType { get; set; } = "training";

        [Required]
        public DateOnly SessionDate { get; set; }

        [Required]
        public AttendanceStatus Status { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public Guid? RecordedBy { get; set; }
    }
}
