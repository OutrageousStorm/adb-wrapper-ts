import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ADB {
  async shell(cmd: string): Promise<string> {
    const { stdout } = await execAsync(`adb shell ${cmd}`);
    return stdout.trim();
  }

  async getProperty(key: string): Promise<string> {
    return this.shell(`getprop ${key}`);
  }

  async listPackages(system: boolean = false): Promise<string[]> {
    const flag = system ? '' : '-3';
    const out = await this.shell(`pm list packages ${flag}`);
    return out.split('\n')
      .filter(l => l.startsWith('package:'))
      .map(l => l.substring(8));
  }

  async install(apk: string): Promise<boolean> {
    const { stdout } = await execAsync(`adb install -r "${apk}"`);
    return stdout.includes('Success');
  }

  async uninstall(pkg: string, keepData: boolean = true): Promise<boolean> {
    const flag = keepData ? '-k' : '';
    const { stdout } = await execAsync(`adb uninstall ${flag} ${pkg}`);
    return stdout.includes('Success');
  }

  async tap(x: number, y: number): Promise<void> {
    await this.shell(`input tap ${x} ${y}`);
  }

  async swipe(x1: number, y1: number, x2: number, y2: number, duration: number = 300): Promise<void> {
    await this.shell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
  }

  async getBattery(): Promise<{ level: number; status: string }> {
    const level = await this.shell("dumpsys battery | grep level");
    const status = await this.shell("dumpsys battery | grep status");
    return {
      level: parseInt(level.match(/\d+/)?.[0] || '0'),
      status: status.split(':')[1]?.trim() || 'unknown'
    };
  }

  async getMemInfo(): Promise<{ total: string; free: string }> {
    const out = await this.shell("cat /proc/meminfo | head -2");
    const lines = out.split('\n');
    return {
      total: lines[0]?.split(/\s+/)[1] || '0',
      free: lines[1]?.split(/\s+/)[1] || '0'
    };
  }

  async screenshot(output: string = 'screenshot.png'): Promise<void> {
    await execAsync(`adb exec-out screencap -p > ${output}`);
  }

  async recordScreen(output: string = 'recording.mp4', seconds: number = 30): Promise<void> {
    await this.shell(`screenrecord --time-limit ${seconds} /sdcard/${output}`);
    await this.shell(`pull /sdcard/${output} .`);
  }
}
