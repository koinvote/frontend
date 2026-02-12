// Browser-side MSW setup
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Create the worker with all handlers
export const worker = setupWorker(...handlers);
