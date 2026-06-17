using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateAttendanceViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public AttendanceStatus Status { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public Guid? RecordedBy { get; set; }
    }
}
