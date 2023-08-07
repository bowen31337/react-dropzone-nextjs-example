/** @type {import('next').NextConfig} */
const nextConfig = {

    serverRuntimeConfig: {
        // Adjust the value to set the maximum allowed file size (1GB in bytes)
        maxFileSize: 1024 * 1024 * 1024, // 1GB
    },
}

module.exports = nextConfig
