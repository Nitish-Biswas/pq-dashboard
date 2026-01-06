/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true, // true = 308 redirect (Cached by browser), false = 307 (Temporary)
      },
    ];
  },
};


export default nextConfig;
