import { execSync, spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface Device {
  serial: string;
  state: string;
}

export class ADB extends EventEmitter {
  private device?: string;

  constructor(deviceSerial?: string) {
    super();
    this.device = deviceSerial;
  }

  private cmd(command: string): string {
    const prefix = this.device ? `-s ${this.device}` : '';
    const full = `adb ${prefix} ${command}`;
    try {
      return execSync(full, { encoding: 'utf-8' }).trim();
    } catch (e) {
      throw new Error(`ADB failed: ${command}`);
    }
  }

  async shell(cmd: string): Promise<string> {
    return this.cmd(`shell ${cmd}`);
  }

  async push(local: string, remote: string): Promise<void> {
    this.cmd(`push ${local} ${remote}`);
  }

  async pull(remote: string, local: string): Promise<void> {
    this.cmd(`pull ${remote} ${local}`);
  }

  async install(apk: string): Promise<boolean> {
    try {
      this.cmd(`install ${apk}`);
      return true;
    } catch {
      return false;
    }
  }

  async getProperty(key: string): Promise<string> {
    return this.shell(`getprop ${key}`);
  }

  async screenshot(): Promise<Buffer> {
    const proc = spawn('adb', ['-s', this.device || '', 'exec-out', 'screencap', '-p']);
    return new Promise((resolve, reject) => {
      let data: Buffer[] = [];
      proc.stdout.on('data', (chunk) => data.push(chunk));
      proc.on('close', (code) => {
        code === 0 ? resolve(Buffer.concat(data)) : reject('Screenshot failed');
      });
    });
  }

  static listDevices(): Device[] {
    const output = execSync('adb devices', { encoding: 'utf-8' });
    const lines = output.split('\n').slice(1);
    return lines
      .filter((l) => l.trim())
      .map((l) => {
        const [serial, state] = l.split(/\s+/);
        return { serial, state };
      });
  }
}

export default ADB;
