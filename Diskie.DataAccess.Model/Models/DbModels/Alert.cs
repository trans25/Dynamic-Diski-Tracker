using Diskie.DataAccess.Model.DbModels;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class Alert : SharedModel
    {
        public Guid PlayerId { get; set; }
        public Guid? MatchId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public bool IsRead { get; set; }

        public User Player { get; set; } = null!;
        public Fixture? Match { get; set; }
    }
}
