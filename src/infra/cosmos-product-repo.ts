import { CosmosClient, Container } from '@azure/cosmos';
import { createProduct, type Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

type CosmosProductDocument = {
  id: string;
  name: string;
  description: string;
  pricePence: number;
  updatedAt: string;
};

export type CosmosProductRepoOptions = {
  endpoint: string;
  databaseId: string;
  containerId: string;
  key: string;
};

export class CosmosProductRepo implements ProductRepo {
  private readonly container: Container;

  constructor(options: CosmosProductRepoOptions) {
    if (!options) {
      throw new Error('CosmosProductRepo requires options');
    }

    const { endpoint, databaseId, containerId, key } = options;

    if (typeof endpoint !== 'string' || endpoint.trim() === '') {
      throw new Error('CosmosProductRepo requires a non-empty endpoint option');
    }

    if (typeof databaseId !== 'string' || databaseId.trim() === '') {
      throw new Error('CosmosProductRepo requires a non-empty databaseId option');
    }

    if (typeof containerId !== 'string' || containerId.trim() === '') {
      throw new Error('CosmosProductRepo requires a non-empty containerId option');
    }

    if (typeof key !== 'string' || key.trim() === '') {
      throw new Error('CosmosProductRepo requires a non-empty key option');
    }

    const cosmosClient = new CosmosClient({ endpoint, key });

    this.container = cosmosClient.database(databaseId).container(containerId);
  }

  // This container uses /id: point operations need the id as the partition value.
  // Other partition designs must supply their actual partition value.
  async getById(id: string): Promise<Product | null> {
    try {
      const { resource } = await this.container
        .item(id, id)
        .read<CosmosProductDocument>();

      if (!resource) {
        return null;
      }

      return this.mapToDomain(resource);
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }

      throw this.wrapError('Unable to get product', error);
    }
  }

  async list(): Promise<Product[]> {
    try {
      // Fetch all results into memory for this small demo; larger datasets need pagination.
      const { resources } = await this.container.items
        .readAll<CosmosProductDocument>()
        .fetchAll();

      return (resources ?? []).map((resource) => this.mapToDomain(resource));
    } catch (error) {
      throw this.wrapError('Unable to list products', error);
    }
  }

  async save(product: Product): Promise<Product> {
    const document = this.mapToDocument(product);

    try {
      const { resource } =
        await this.container.items.upsert<CosmosProductDocument>(document);

      if (!resource) {
        throw new Error('No resource returned from Cosmos DB upsert');
      }

      return this.mapToDomain(resource);
    } catch (error) {
      throw this.wrapError('Unable to save product', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.container.item(id, id).delete();
    } catch (error) {
      if (this.isNotFound(error)) {
        return;
      }

      throw this.wrapError('Unable to delete product', error);
    }
  }

  private mapToDomain(document: CosmosProductDocument): Product {
    return createProduct({
      id: document.id,
      name: document.name,
      description: document.description,
      pricePence: document.pricePence,
      updatedAt: new Date(document.updatedAt),
    });
  }

  private mapToDocument(product: Product): CosmosProductDocument {
    if (!(product.updatedAt instanceof Date)) {
      throw new Error(
        'Product.updatedAt must be a Date instance before persisting'
      );
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      pricePence: product.pricePence,
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private isNotFound(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const statusCode = (error as { statusCode?: number }).statusCode;
    const code = (error as { code?: number | string }).code;

    return (
      statusCode === 404 ||
      code === 404 ||
      code === 'NotFound' ||
      code === 'ResourceNotFound'
    );
  }

  private wrapError(message: string, error: unknown): Error {
    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`);
    }

    return new Error(`${message}: ${String(error)}`);
  }
}
