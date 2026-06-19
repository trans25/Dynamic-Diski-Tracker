using System.ComponentModel.DataAnnotations;

namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class ImportPlayersViewModel
    {
        [Required]
        [MinLength(1)]
        public List<ImportPlayerRow> Players { get; set; } = new();
    }

    public class ImportPlayerRow
    {
        [Required]
        [StringLength(200)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Position { get; set; }

        public int? JerseyNumber { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        [StringLength(200)]
        public string? GuardianName { get; set; }

        [EmailAddress]
        [StringLength(256)]
        public string? GuardianEmail { get; set; }

        [Phone]
        [StringLength(50)]
        public string? GuardianPhone { get; set; }
    }

    public class ImportPlayersResultViewModel
    {
        public int CreatedCount { get; set; }
        public int FailedCount { get; set; }
        public IReadOnlyList<RosterPlayerViewModel> CreatedPlayers { get; set; } = new List<RosterPlayerViewModel>();
        public IReadOnlyList<string> Errors { get; set; } = new List<string>();
    }
}
