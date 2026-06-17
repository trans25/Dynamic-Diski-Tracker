using System.Linq.Expressions;
using Diskie.DataAccess.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Diskie.DataAccess.Repository
{
    public abstract class RepositoryBase<T> : IRepositoryBase<T> where T : class
    {
        protected readonly DiskiDbContext RepositoryContext;

        protected RepositoryBase(DiskiDbContext repositoryContext)
        {
            RepositoryContext = repositoryContext;
        }

        public IQueryable<T> FindAll(bool trackChanges = false) =>
            trackChanges
                ? RepositoryContext.Set<T>()
                : RepositoryContext.Set<T>().AsNoTracking();

        public IQueryable<T> FindByCondition(Expression<Func<T, bool>> expression, bool trackChanges = false) =>
            trackChanges
                ? RepositoryContext.Set<T>().Where(expression)
                : RepositoryContext.Set<T>().Where(expression).AsNoTracking();

        public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            await RepositoryContext.Set<T>().FindAsync(new object?[] { id }, cancellationToken);

        public T Create(T entity)
        {
            RepositoryContext.Set<T>().Add(entity);
            return entity;
        }

        public void Update(T entity) => RepositoryContext.Set<T>().Update(entity);

        public void Delete(T entity) => RepositoryContext.Set<T>().Remove(entity);

        public async Task<int> SaveAsync(CancellationToken cancellationToken = default) =>
            await RepositoryContext.SaveChangesAsync(cancellationToken);
    }
}
