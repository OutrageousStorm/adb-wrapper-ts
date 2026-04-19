import { exec } from "child_process";
import { promisify } from "util";
import { which } from "which";

const execAsync = promisify(exec);

export interface DeviceInfo {
  serial: string;
  state: "device" | "offline" | "unauthorized" | "unknown";
  model?: string;
  androidVersion?: string;
  apiLevel?: number;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class AdbWrapper {
  private adbPath: string;

  constructor(adbPath?: string) {
    this.adbPath = adbPath || "adb";
  }

  /**
   * List all connected devices
   */
  async listDevices(): Promise<DeviceInfo[]> {
    const result = await this.executeCommand("devices -l");
    const lines = result.split("\n").slice(1);
    return lines
      .filter((l) => l.trim() && !l.includes("List of"))
      .map((line) => {
        const parts = line.split(/\s+/);
        return {
          serial: parts[0],
          state: parts[1] as any,
          model: parts.find((p) => p.startsWith("model:"))?.split(":")[1],
          androidVersion: parts.find((p) => p.startsWith("device:"))?.split(":")[1],
        };
      });
  }

  /**
   * Get device info (model, Android version, etc.)
   */
  async getDeviceInfo(serial: string): Promise<Record<string, string>> {
    const getprop = async (key: string) =>
      (await this.shell(`getprop ${key}`, serial)).trim();

    return {
      model: await getprop("ro.product.model"),
      brand: await getprop("ro.product.brand"),
      android: await getprop("ro.build.version.release"),
      apiLevel: await getprop("ro.build.version.sdk"),
      serialNo: await getprop("ro.serialno"),
      kernel: await getprop("ro.kernel.version"),
    };
  }

  /**
   * Execute ADB command
   */
  async executeCommand(cmd: string, serial?: string): Promise<string> {
    const fullCmd = serial ? `${this.adbPath} -s ${serial} ${cmd}` : `${this.adbPath} ${cmd}`;
    const { stdout } = await execAsync(fullCmd);
    return stdout;
  }

  /**
   * Execute shell command on device
   */
  async shell(cmd: string, serial?: string): Promise<string> {
    return this.executeCommand(`shell ${cmd}`, serial);
  }

  /**
   * Install APK
   */
  async install(apkPath: string, serial?: string): Promise<boolean> {
    const result = await this.executeCommand(`install "${apkPath}"`, serial);
    return result.includes("Success");
  }

  /**
   * Uninstall package
   */
  async uninstall(packageName: string, serial?: string): Promise<boolean> {
    const result = await this.executeCommand(`uninstall ${packageName}`, serial);
    return result.includes("Success");
  }

  /**
   * List installed packages
   */
  async listPackages(serial?: string, userOnly = true): Promise<string[]> {
    const flag = userOnly ? "-3" : "";
    const result = await this.shell(`pm list packages ${flag}`, serial);
    return result
      .split("\n")
      .filter((l) => l.startsWith("package:"))
      .map((l) => l.replace("package:", ""));
  }

  /**
   * Get app memory usage
   */
  async getMemoryUsage(packageName: string, serial?: string): Promise<Record<string, number>> {
    const result = await this.shell(`dumpsys meminfo ${packageName}`, serial);
    const match = result.match(/TOTAL\s+(\d+)/);
    return {
      totalKb: match ? parseInt(match[1]) : 0,
    };
  }

  /**
   * Push file to device
   */
  async push(localPath: string, remotePath: string, serial?: string): Promise<boolean> {
    const result = await this.executeCommand(`push "${localPath}" "${remotePath}"`, serial);
    return !result.includes("error");
  }

  /**
   * Pull file from device
   */
  async pull(remotePath: string, localPath: string, serial?: string): Promise<boolean> {
    const result = await this.executeCommand(`pull "${remotePath}" "${localPath}"`, serial);
    return !result.includes("error");
  }

  /**
   * Reboot device
   */
  async reboot(mode: "system" | "recovery" | "bootloader" = "system", serial?: string): Promise<void> {
    await this.executeCommand(`reboot ${mode}`, serial);
  }
}

// CLI usage example
if (require.main === module) {
  (async () => {
    const adb = new AdbWrapper();
    const devices = await adb.listDevices();
    console.log("Connected devices:", devices);

    if (devices.length > 0) {
      const info = await adb.getDeviceInfo(devices[0].serial);
      console.log("Device info:", info);
    }
  })();
}

export default AdbWrapper;
