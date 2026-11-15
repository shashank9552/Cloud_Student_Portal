/**
 * Root Router Bridge
 * Re-exports the central handler from ./handlers/apiRouter.js
 * Allows Lambda Handler to be configured as either:
 * - src/apiRouter.handler
 * - src/handlers/apiRouter.handler
 */
import { handler as mainHandler } from './handlers/apiRouter.js';

export const handler = mainHandler;
export default { handler };
