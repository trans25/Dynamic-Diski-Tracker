using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class UpdateAvailabilityViewModel
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public AvailabilityStatus Status { get; set; }

        [StringLength(50)]
        public string? ResponseSource { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }
    }
}
