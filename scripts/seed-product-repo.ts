import { getCosmosTarget, getProductRepo } from '../src/config/composition-root';
import { testProducts } from './test-products';

async function main(): Promise<void> {
  const repo = getProductRepo();
  console.log('Seed target:', JSON.stringify(getCosmosTarget(), null, 2));
  console.log('Reruns overwrite the three sample IDs and retain unrelated records.');
  console.log('Writes are sequential, not transactional; a failure can leave earlier writes saved.');

  for (const product of testProducts) {
    await repo.save(product);
    console.log(`Seeded product ${product.id}`);
  }

  console.log('Completed seeding products.');
}

main().catch((error: unknown) => {
  console.error(
    'Failed to seed products:',
    error instanceof Error ? error.message : 'Unexpected seeding failure'
  );
  process.exitCode = 1;
});
