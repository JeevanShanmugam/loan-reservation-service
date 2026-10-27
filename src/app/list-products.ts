import { Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export type ListProductsDeps = {
  productRepo: ProductRepo;
};

export type ListProductsResult =
  | { success: true; data: Product[] }
  | { success: false; error: string };

/**
 * Create a use-case for listing products.
 * Usage:
 *   const result = await listProducts({ productRepo });
 */
export async function listProducts(
  deps: ListProductsDeps
): Promise<ListProductsResult> {
  const { productRepo } = deps;

  try {
    const products = await productRepo.list();
    return { success: true, data: products };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list products',
    };
  }
}
