# ADB Wrapper — TypeScript

Type-safe TypeScript wrapper for Android ADB commands. Full coverage of common operations.

```typescript
import { ADB } from './adb';

const adb = new ADB();

// Device info
const model = await adb.getProperty('ro.product.model');
const apps = await adb.listPackages();

// Install/uninstall
await adb.install('app.apk');
await adb.uninstall('com.example.app');

// Control
await adb.tap(540, 960);
await adb.swipe(540, 1500, 540, 500);
await adb.shell('pm clear com.example.app');

// Query
const battery = await adb.getBattery();
const meminfo = await adb.getMemInfo();
```
