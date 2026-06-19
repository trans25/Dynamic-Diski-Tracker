namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class CreateMatchEventViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public string Kind { get; set; } = string.Empty;
        public string Side { get; set; } = string.Empty;
        public int Minute { get; set; }
    }

    public class MatchEventViewModel
    {
        public Guid Id { get; set; }
        public Guid MatchId { get; set; }
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public string Kind { get; set; } = string.Empty;
        public string Side { get; set; } = string.Empty;
        public int Minute { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MatchPlayerStatsViewModel
    {
        public Guid PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int Goals { get; set; }
        public int Assists { get; set; }
        public int YellowCards { get; set; }
        public int MetricScore { get; set; }
    }

    public class LiveMatchViewModel
    {
        public Guid Id { get; set; }
        public string HomeTeamName { get; set; } = string.Empty;
        public string AwayTeamName { get; set; } = string.Empty;
        public int HomeScore { get; set; }
        public int AwayScore { get; set; }
        public int ClockSecondsRemaining { get; set; }
        public string Formation { get; set; } = "4-3-3";
        public string Status { get; set; } = "Live";
        public List<MatchEventViewModel> Events { get; set; } = new();
        public List<MatchPlayerStatsViewModel> Players { get; set; } = new();
    }
}
