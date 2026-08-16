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
  images: {
    // Replace deprecated domains with remotePatterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images (adjust for production)
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
    ],
  },
  devIndicators: false, 
  // Enable React strict mode for better development
  reactStrictMode: true,
  // Turbopack configuration (for Next.js 15+)
  turbopack: {
    // Optional: Configure turbopack if needed
  },
};

export default nextConfig;
