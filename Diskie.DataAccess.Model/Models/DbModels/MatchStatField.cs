using System;
using System.Collections.Generic;
using System.Text;

namespace Diskie.DataAccess.Model.Models.DbModels
{
   
    public class MatchStatField
    {
        public string Key { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string Type { get; set; } = null!; 
        public string? Description { get; set; }
        public double? DefaultValue { get; set; }
    }
}
