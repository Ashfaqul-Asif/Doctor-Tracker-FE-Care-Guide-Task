import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// `import.meta.dirname` only exists from Node 20.11; this project's floor is 20.10.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Pinned explicitly because Turbopack infers the root by walking up for a lockfile,
     * and this project happens to sit under a drive root that contains an unrelated
     * `yarn.lock`. Left to guess, it warns and picks a root outside the repository.
     */
    root: projectRoot,
  },
};

export default nextConfig;
