/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // SERVER: 'http://localhost:3001',
    SERVER: 'https://backend-watchflix.herokuapp.com',
  },
  reactStrictMode: true,
}

module.exports = nextConfig
