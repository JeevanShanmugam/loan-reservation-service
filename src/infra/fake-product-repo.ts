import { Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

// Deep copy a product, including the updatedAt date. This is important because
// the repo is in-memory and we don't want to return references to stored
// products, which would allow external code to mutate them. We need to clone
// the date so changing an input or returned product cannot change stored data.
const cloneProduct = (product: Product): Product => ({
  ...product,
  updatedAt: new Date(product.updatedAt.getTime()),
});

/**
 * Fake in-memory implementation of ProductRepo for tests and local dev.
 * Not safe for concurrency across processes — intended as a fake.
 */
export class FakeProductRepo implements ProductRepo {
  private store: Map<string, Product> = new Map();

  constructor(initial: Product[] = []) {
    for (const p of initial) this.store.set(p.id, cloneProduct(p));
  }

  async getById(id: string): Promise<Product | null> {
    const found = this.store.get(id) ?? null;
    return found ? cloneProduct(found) : null;
  }

  async list(): Promise<Product[]> {
    return Array.from(this.store.values()).map(cloneProduct);
  }

  async save(product: Product): Promise<Product> {
    // upsert semantics: store the product, return the saved copy
    const toStore = cloneProduct(product);
    this.store.set(toStore.id, toStore);
    return cloneProduct(toStore);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
