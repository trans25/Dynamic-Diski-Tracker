using Diskie.DataAccess.Model.DbModels;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class PlayerSkill : SharedModel
    {
        public Guid PlayerId { get; set; }
        public int Attacking { get; set; }
        public int Defending { get; set; }
        public int Passing { get; set; }
        public int Physicality { get; set; }
        public int Composure { get; set; }
        public string Season { get; set; } = string.Empty;

        public User Player { get; set; } = null!;
    }
}
