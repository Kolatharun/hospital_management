const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Balaji Heart Center Unified Suite Build...');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

// Clear / ensure dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy root portal index.html
const rootIndexHtml = path.join(rootDir, 'index.html');
if (fs.existsSync(rootIndexHtml)) {
  fs.copyFileSync(rootIndexHtml, path.join(distDir, 'index.html'));
  console.log('✅ Copied Master Portal index.html to dist/index.html');
}

const apps = [
  { name: 'opd_amb', folder: 'opd_amb', basePath: '/opd_amb/' },
  { name: 'opd_pharma', folder: 'opd_pharma', basePath: '/opd_pharma/' },
  { name: 'opd_pwa', folder: 'opd_pwa', basePath: '/opd_pwa/' },
  { name: 'opd_web', folder: 'opd_web', basePath: '/opd_web/' }
];

apps.forEach(app => {
  const appDir = path.join(rootDir, app.folder);
  const targetDist = path.join(distDir, app.folder);

  console.log(`\n📦 Building ${app.name}...`);

  try {
    // Run npm build inside sub-app directory
    execSync('npm run build', {
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_BASE: app.basePath
      }
    });

    const appDist = path.join(appDir, 'dist');
    if (fs.existsSync(appDist)) {
      fs.cpSync(appDist, targetDist, { recursive: true });
      console.log(`✅ Successfully bundled ${app.name} -> dist/${app.folder}`);
    } else {
      console.warn(`⚠️ Warning: ${appDist} not found after build.`);
    }
  } catch (err) {
    console.error(`❌ Build failed for ${app.name}:`, err.message);
  }
});

console.log('\n🎉 Build Complete! All 4 applications and Master Portal are bundled in /dist');
