# ⚡ ADB Wrapper for TypeScript/Node.js

Type-safe, promise-based Android ADB wrapper for Node.js projects.

## Install

```bash
npm install @outrageousstorm/adb-wrapper
```

## Usage

```typescript
import ADBWrapper from '@outrageousstorm/adb-wrapper';

const adb = new ADBWrapper();

// List all devices
const devices = await adb.listDevices();

// Select device
adb.selectDevice(devices[0].serial);

// Get device info
const info = await adb.getDeviceInfo();
console.log(info); // { model, version, sdk, security }

// Get battery
const battery = await adb.getBattery();

// List packages
const pkgs = await adb.listPackages(true); // true = user only

// Revoke permission
await adb.revokePermission('com.app', 'android.permission.LOCATION');

// Touch automation
await adb.tap(540, 960);
await adb.swipe(540, 1000, 540, 500, 300);

// File transfer
await adb.pushFile('./file.txt', '/sdcard/');
await adb.pullFile('/sdcard/file.txt', './');
```
