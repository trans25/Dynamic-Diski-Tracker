namespace Diskie.DataAccess.Model.Models.ViewModels
{
    public class GlobalSearchItemViewModel
    {
        public string Type { get; set; } = string.Empty; // player | match
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class GlobalSearchResponseViewModel
    {
        public string Query { get; set; } = string.Empty;
        public string TypeFilter { get; set; } = "all";
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<GlobalSearchItemViewModel> Items { get; set; } = new();
    }
}
