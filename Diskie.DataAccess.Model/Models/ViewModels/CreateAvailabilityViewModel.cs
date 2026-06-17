using System.ComponentModel.DataAnnotations;
using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateAvailabilityViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        public Guid FixtureId { get; set; }

        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public AvailabilityStatus Status { get; set; } = AvailabilityStatus.NoResponse;

        [StringLength(50)]
        public string? ResponseSource { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }
    }
}
