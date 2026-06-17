using Diskie.DataAccess.Model.Models.Enums;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class AvailabilityViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public Guid FixtureId { get; set; }
        public Guid TeamId { get; set; }
        public AvailabilityStatus Status { get; set; }
        public string? ResponseSource { get; set; }
        public DateTime? ResponseTimestamp { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
