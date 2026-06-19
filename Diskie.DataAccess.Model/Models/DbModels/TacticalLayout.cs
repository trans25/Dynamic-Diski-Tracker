namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class TacticalLayout : SharedModel
    {
        public Guid MatchId { get; set; }
        public string Data { get; set; } = "[]";

        public Fixture Match { get; set; } = null!;
    }
}
