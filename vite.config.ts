import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Generate build-specific information
    const now = new Date();
    const buildDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const buildTime = now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const buildId = `${buildDate.replace(/-/g, '')}-${buildTime.replace(/:/g, '')}`; // YYYYMMDD-HHMMSS
    
    // Read version from package.json
    const packageJsonPath = path.resolve(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version;
    
    // Generate dynamic app name with build info
    const appName = `AmAIke-${version}-${buildId}`;
    
    console.log(`🚀 Building ${appName}`);
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Inject build-time variables
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
        'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
        'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
        'import.meta.env.VITE_APP_NAME': JSON.stringify(appName)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Include build ID in output filenames for unique builds
      build: {
        rollupOptions: {
          output: {
            entryFileNames: `assets/[name]-${buildId}.[hash].js`,
            chunkFileNames: `assets/[name]-${buildId}.[hash].js`,
            assetFileNames: `assets/[name]-${buildId}.[hash].[ext]`
          }
        }
      }
    };
});
