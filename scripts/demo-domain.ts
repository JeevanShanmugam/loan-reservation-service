import { createProduct, ProductError } from '../src/domain/product';

// After adding the 100-character limit, this same example should report a name error.
try {
  const product = createProduct({
    id: 'product-1',
    name: 'A'.repeat(101),
    pricePence: 1250,
    description: 'A sample product.',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  console.log(
    'Created Product with a ' + product.name.length + '-character name:',
  );
  console.log(product);
} catch (error: unknown) {
  if (error instanceof ProductError && error.field === 'name') {
    console.log(error.name + ' (field: ' + error.field + '): ' + error.message);
  } else {
    throw error;
  }
}
