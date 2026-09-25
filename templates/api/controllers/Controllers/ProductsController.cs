using __API_NAME__.Models;
using __API_NAME__.Services;
using Microsoft.AspNetCore.Mvc;

namespace __API_NAME__.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    /// <summary>Returns every product.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<Product>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetAllAsync(CancellationToken cancellationToken)
        => Ok(await _products.GetAllAsync(cancellationToken));

    /// <summary>Returns a single product by its identifier.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var product = await _products.GetByIdAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    /// <summary>Creates a new product.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(Product), StatusCodes.Status201Created)]
    public async Task<ActionResult<Product>> CreateAsync(Product product, CancellationToken cancellationToken)
    {
        var created = await _products.CreateAsync(product, cancellationToken);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
    }
}
