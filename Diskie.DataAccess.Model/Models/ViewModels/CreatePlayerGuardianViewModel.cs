using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreatePlayerGuardianViewModel
    {
        [Required]
        public Guid PlayerId { get; set; }

        [Required]
        public Guid GuardianId { get; set; }

        public bool IsPrimary { get; set; }
        public int ConsentPriority { get; set; } = 1;
    }
}
