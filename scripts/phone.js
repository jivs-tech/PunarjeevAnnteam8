const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const candidates = [
  'adb',
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
  'C:\\Android\\Sdk\\platform-tools\\adb.exe',
  'C:\\Android\\platform-tools\\adb.exe'
];

let adbPath = null;
for (const cand of candidates) {
  try {
    if (cand === 'adb') {
      execSync('adb --version', { stdio: 'ignore' });
      adbPath = 'adb';
      break;
    } else if (fs.existsSync(cand)) {
      adbPath = `"${cand}"`;
      break;
    }
  } catch (e) {}
}

if (!adbPath) {
  console.error('❌ Could not find adb.exe. Please ensure Android SDK platform-tools is installed.');
  process.exit(1);
}

console.log(`📱 Found ADB at: ${adbPath}`);
try {
  console.log('🔄 Reversing port 3000 to phone...');
  execSync(`${adbPath} reverse tcp:3000 tcp:3000`, { stdio: 'inherit' });
  
  console.log('🚀 Opening http://localhost:3000 on phone screen...');
  execSync(`${adbPath} shell am start -a android.intent.action.VIEW -d http://localhost:3000`, { stdio: 'inherit' });
  
  console.log('✅ Successfully launched PunarJeevAnn on phone!');
} catch (err) {
  console.error('⚠️ Failed to launch on phone:', err.message);
}
