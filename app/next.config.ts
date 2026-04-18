import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

export default withMDX({
  outputFileTracingIncludes: {
    "/api/og": ["./src/lib/fonts/**"],
  },
});
