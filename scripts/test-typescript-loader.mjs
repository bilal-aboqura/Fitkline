import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
    if (specifier.startsWith("@/")) {
      return nextResolve(pathToFileURL(path.resolve(specifier.slice(2) + ".ts")).href, context);
    }
    return nextResolve(specifier, context);
  },
});
