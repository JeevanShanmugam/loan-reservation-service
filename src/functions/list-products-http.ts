import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { listProducts } from '../app/list-products';
import { createListProductsDeps } from '../config/composition-root';

const listProductsHandler = async (
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  const failureResponse: HttpResponseInit = {
    status: 500,
    jsonBody: { success: false, message: 'Failed to list products' },
  };
  let stage = 'dependency construction';

  try {
    const deps = createListProductsDeps();
    stage = 'use-case execution';
    const result = await listProducts(deps);

    if (!result.success) {
      // Keep internal error messages out of the public response and logs.
      context.error('Failed to list products', { stage });
      return failureResponse;
    }

    stage = 'response serialisation';
    return {
      status: 200,
      jsonBody: result.data.map((product) => ({
        ...product,
        updatedAt: product.updatedAt.toISOString(),
      })),
    };
  } catch (error: unknown) {
    // Log only the stage and error category, never SDK objects or configuration.
    context.error('Failed to list products', {
      stage,
      errorType: error instanceof TypeError ? 'TypeError'
        : error instanceof RangeError ? 'RangeError'
        : error instanceof Error ? 'Error' : typeof error,
    });
    return failureResponse;
  }
};

app.http('listProductsHttp', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'products',
  handler: listProductsHandler,
});
