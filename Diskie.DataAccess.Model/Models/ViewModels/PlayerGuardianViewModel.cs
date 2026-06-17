namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class PlayerGuardianViewModel
    {
        public Guid PlayerId { get; set; }
        public Guid GuardianId { get; set; }
        public bool IsPrimary { get; set; }
        public int ConsentPriority { get; set; }
    }
}
