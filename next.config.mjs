/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // Ignore optional dependencies that aren't needed
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp:
          /^(@gemini-wallet\/core|@react-native-async-storage\/async-storage)$/,
      })
    );

    return config;
  },
};

export default nextConfig;
