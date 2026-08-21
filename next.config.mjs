/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Pin the workspace root so Turbopack ignores stray lockfiles in parent
  // directories and resolves modules from this project only.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
