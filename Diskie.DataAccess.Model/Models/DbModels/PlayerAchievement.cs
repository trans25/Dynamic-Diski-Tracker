using Diskie.DataAccess.Model.DbModels;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class PlayerAchievement : SharedModel
    {
        public Guid PlayerId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string IconKey { get; set; } = string.Empty;
        public DateTime AwardedAt { get; set; }
        public Guid? FixtureId { get; set; }

        public User Player { get; set; } = null!;
        public Fixture? Fixture { get; set; }
    }
}
