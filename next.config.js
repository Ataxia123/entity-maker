const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})
module.exports = withBundleAnalyzer({
  experimental: { appDir: true },
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.experiments = { ...config.experiments, topLevelAwait: true };
    config.externals = [...config.externals, 'hnswlib-node'];  // by adding this line, solved the import
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    /* 

  webpack(config) {

    return config;
  },
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
    };

    config.module.rules.push({
      test: /\.md$/i,
      use: "raw-loader",
    });
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
        // by next.js will be dropped. Doesn't make much sense, but how it is
        fs: false, // the solution
        "node:fs/promises": false,
        module: false,
        perf_hooks: false,
      };

    }

   */
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.ai-universe.io",
        port: "",
      },
    ],
  },

})
