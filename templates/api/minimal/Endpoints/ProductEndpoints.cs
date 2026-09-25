using __API_NAME__.Models;
using __API_NAME__.Services;

namespace __API_NAME__.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/products")
            .WithTags("Products");

        group.MapGet("/", async (IProductService service, CancellationToken cancellationToken) =>
                TypedResults.Ok(await service.GetAllAsync(cancellationToken)))
            .WithName("GetProducts")
            .WithSummary("Returns every product.")
            .Produces<IReadOnlyList<Product>>(StatusCodes.Status200OK);

        group.MapGet("/{id:int}", async (int id, IProductService service, CancellationToken cancellationToken) =>
            {
                var product = await service.GetByIdAsync(id, cancellationToken);
                return product is null
                    ? Results.NotFound()
                    : Results.Ok(product);
            })
            .WithName("GetProductById")
            .WithSummary("Returns a single product by its identifier.")
            .Produces<Product>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (Product product, IProductService service, CancellationToken cancellationToken) =>
            {
                var created = await service.CreateAsync(product, cancellationToken);
                return TypedResults.Created($"/api/products/{created.Id}", created);
            })
            .WithName("CreateProduct")
            .WithSummary("Creates a new product.")
            .Produces<Product>(StatusCodes.Status201Created);

        return endpoints;
    }
}
