import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Device {
  serial: string;
  status: 'device' | 'offline' | 'unauthorized';
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
  success: boolean;
}

export class ADBWrapper {
  private serial: string | null = null;

  async listDevices(): Promise<Device[]> {
    const { stdout } = await execAsync('adb devices');
    const lines = stdout.split('\n').slice(1).filter(l => l.trim());
    return lines.map(line => {
      const [serial, status] = line.split(/\s+/);
      return { serial, status: status as any };
    });
  }

  selectDevice(serial: string) {
    this.serial = serial;
    return this;
  }

  private getCmd(cmd: string): string {
    const prefix = this.serial ? `-s ${this.serial}` : '';
    return `adb ${prefix} shell ${cmd}`;
  }

  async exec(cmd: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(this.getCmd(cmd));
      return { stdout: stdout.trim(), stderr: stderr.trim(), code: 0, success: true };
    } catch (err: any) {
      return { stdout: '', stderr: err.message, code: err.code || 1, success: false };
    }
  }

  async getProperty(key: string): Promise<string> {
    const result = await this.exec(`getprop ${key}`);
    return result.stdout;
  }

  async getBattery(): Promise<any> {
    const result = await this.exec('dumpsys battery');
    const battery: any = {};
    result.stdout.split('\n').forEach(line => {
      const [k, v] = line.trim().split(':').map(s => s.trim());
      if (k && v) battery[k] = v;
    });
    return battery;
  }

  async getDeviceInfo() {
    const [model, version, sdk, security] = await Promise.all([
      this.getProperty('ro.product.model'),
      this.getProperty('ro.build.version.release'),
      this.getProperty('ro.build.version.sdk'),
      this.getProperty('ro.build.version.security_patch'),
    ]);
    return { model, version, sdk, security };
  }

  async listPackages(userOnly = false): Promise<string[]> {
    const flag = userOnly ? '-3' : '';
    const result = await this.exec(`pm list packages ${flag}`);
    return result.stdout
      .split('\n')
      .filter(l => l.startsWith('package:'))
      .map(l => l.replace('package:', ''));
  }

  async revokePermission(pkg: string, perm: string): Promise<boolean> {
    const result = await this.exec(`pm revoke ${pkg} ${perm}`);
    return result.stdout.includes('Success') || result.success;
  }

  async pushFile(local: string, remote: string): Promise<boolean> {
    try {
      const cmd = this.serial ? `adb -s ${this.serial}` : 'adb';
      await execAsync(`${cmd} push "${local}" "${remote}"`);
      return true;
    } catch {
      return false;
    }
  }

  async pullFile(remote: string, local: string): Promise<boolean> {
    try {
      const cmd = this.serial ? `adb -s ${this.serial}` : 'adb';
      await execAsync(`${cmd} pull "${remote}" "${local}"`);
      return true;
    } catch {
      return false;
    }
  }

  async tap(x: number, y: number): Promise<boolean> {
    const result = await this.exec(`input tap ${x} ${y}`);
    return result.success;
  }

  async swipe(x1: number, y1: number, x2: number, y2: number, ms = 300): Promise<boolean> {
    const result = await this.exec(`input swipe ${x1} ${y1} ${x2} ${y2} ${ms}`);
    return result.success;
  }
}

export default ADBWrapper;
