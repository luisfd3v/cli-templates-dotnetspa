using System.Collections.Concurrent;
using __API_NAME__.Models;

namespace __API_NAME__.Services;

/// <summary>
/// Throwaway in-memory store so the sample endpoints return something useful.
/// Replace it with your real data access.
/// </summary>
public sealed class InMemoryProductService : IProductService
{
    private readonly ConcurrentDictionary<int, Product> _products = new();
    private int _nextId;

    public InMemoryProductService()
    {
        Seed(new Product { Name = "Sample product", Price = 9.99m });
        Seed(new Product { Name = "Another product", Price = 24.50m });
    }

    public Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<Product>>(_products.Values.OrderBy(product => product.Id).ToArray());

    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => Task.FromResult(_products.TryGetValue(id, out var product) ? product : null);

    public Task<Product> CreateAsync(Product product, CancellationToken cancellationToken = default)
        => Task.FromResult(Seed(product));

    private Product Seed(Product product)
    {
        product.Id = Interlocked.Increment(ref _nextId);
        _products[product.Id] = product;
        return product;
    }
}
