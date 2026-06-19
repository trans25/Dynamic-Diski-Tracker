namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class MatchAvailabilityItemViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? ResponseDate { get; set; }
        public string? Position { get; set; }
    }

    public class RequestAvailabilityViewModel
    {
        public List<Guid> PlayerIds { get; set; } = new();
    }

    public class UpdateAvailabilityItemViewModel
    {
        public Guid PlayerId { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateMatchAvailabilityViewModel
    {
        public List<UpdateAvailabilityItemViewModel> Players { get; set; } = new();
    }

    public class TacticalLayoutItemViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public double X { get; set; }
        public double Y { get; set; }
    }

    public class SaveTacticalLayoutViewModel
    {
        public Guid MatchId { get; set; }
        public string? FormationId { get; set; }
        public List<Guid> BenchPlayerIds { get; set; } = new();
        public MatchdayPlannerViewModel Planner { get; set; } = new();
        public List<TacticalLayoutItemViewModel> Players { get; set; } = new();
    }

    public class TacticalLayoutViewModel
    {
        public Guid MatchId { get; set; }
        public string? FormationId { get; set; }
        public List<Guid> BenchPlayerIds { get; set; } = new();
        public MatchdayPlannerViewModel Planner { get; set; } = new();
        public List<TacticalLayoutItemViewModel> Players { get; set; } = new();
    }

    public class MatchdayPlannerViewModel
    {
        public string Status { get; set; } = "Draft";
        public Guid? CaptainId { get; set; }
        public Guid? ViceCaptainId { get; set; }
        public Guid? PenaltyTakerId { get; set; }
        public string? SquadNotes { get; set; }
        public string? InPossessionPlan { get; set; }
        public string? OutOfPossessionPlan { get; set; }
        public string? SetPieceNotes { get; set; }
    }

    public class AlertViewModel
    {
        public Guid Id { get; set; }
        public Guid PlayerId { get; set; }
        public Guid? MatchId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AlertsResponseViewModel
    {
        public int UnreadCount { get; set; }
        public List<AlertViewModel> Items { get; set; } = new();
    }

    public class ImportPlayersCsvResultViewModel
    {
        public int ImportedCount { get; set; }
        public int DuplicateCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
