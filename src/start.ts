// TanStack Start entry. Provides the start options consumed during hydration.
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  defaultSsr: true,
  serializationAdapters: [],
}));
