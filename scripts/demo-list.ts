import { listProducts } from '../src/app/list-products';
import { createProduct } from '../src/domain/product';
import type { ProductRepo } from '../src/domain/product-repo';
import { FakeProductRepo } from '../src/infra/fake-product-repo';

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (process.argv.length !== 3 || (mode !== 'fake' && mode !== 'cosmos')) {
    throw new Error('Usage: npm run demo:list -- fake|cosmos');
  }

  let productRepo: ProductRepo;
  if (mode === 'fake') {
    productRepo = new FakeProductRepo([
      createProduct({
        id: 'demo-product-1',
        name: 'Example product',
        description: 'A deterministic product for the fake repository demo.',
        pricePence: 1250,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);
    console.log('Adapter: FakeProductRepo');
  } else {
    // Load Cosmos composition only when requested; fake mode needs no Azure settings.
    const { getProductRepo } =
      await import('../src/config/composition-root.js');
    productRepo = getProductRepo();
    console.log('Adapter: CosmosProductRepo');
  }

  const result = await listProducts({ productRepo });
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'List demo failed');
  process.exitCode = 1;
});
