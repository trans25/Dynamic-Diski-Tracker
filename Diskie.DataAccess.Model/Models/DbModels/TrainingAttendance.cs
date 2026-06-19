using Diskie.DataAccess.Model.DbModels;

namespace Diskie.DataAccess.Model.Models.DbModels
{
    public class TrainingAttendance : SharedModel
    {
        public Guid PlayerId { get; set; }
        public DateOnly SessionDate { get; set; }
        public bool IsPresent { get; set; }
        public bool IsLate { get; set; }

        public User Player { get; set; } = null!;
    }
}
