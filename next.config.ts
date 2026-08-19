// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;



// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//  devIndicators: false,
//  images: {
//     domains: ['images.unsplash.com', 'res.cloudinary.com']
//  }
// };

// export default nextConfig;

// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: '**', // Allow all HTTPS images (adjust for production)
  //     },
  //     {
  //       protocol: 'http',
  //       hostname: 'localhost',
  //       port: '5000',
  //     },
  //   ],
  // },
  images: {
    // Add this to ensure local public images are handled correctly if you have a custom loader
    unoptimized: process.env.NODE_ENV === 'development', 
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost', port: '5000' },
    ],
  },
  
  devIndicators: false, 
  reactStrictMode: true,
  turbopack: {
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'unload=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
