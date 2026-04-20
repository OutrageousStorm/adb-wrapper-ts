import { execSync, spawn } from 'child_process';

export class ADB {
    constructor(private device?: string) {}

    private buildCmd(cmd: string): string {
        return this.device ? `adb -s ${this.device} ${cmd}` : `adb ${cmd}`;
    }

    shell(cmd: string): string {
        return execSync(this.buildCmd(`shell ${cmd}`), { encoding: 'utf8' }).trim();
    }

    push(local: string, remote: string): boolean {
        try {
            execSync(this.buildCmd(`push "${local}" "${remote}"`));
            return true;
        } catch { return false; }
    }

    pull(remote: string, local: string): boolean {
        try {
            execSync(this.buildCmd(`pull "${remote}" "${local}"`));
            return true;
        } catch { return false; }
    }

    install(apk: string): boolean {
        try {
            execSync(this.buildCmd(`install -r "${apk}"`));
            return true;
        } catch { return false; }
    }

    uninstall(pkg: string): boolean {
        try {
            execSync(this.buildCmd(`uninstall ${pkg}`));
            return true;
        } catch { return false; }
    }

    getDeviceInfo() {
        return {
            model: this.shell('getprop ro.product.model'),
            android: this.shell('getprop ro.build.version.release'),
            api: this.shell('getprop ro.build.version.sdk'),
        };
    }

    listPackages(userOnly = false): string[] {
        const out = this.shell(`pm list packages ${userOnly ? '-3' : ''}`);
        return out.split('\n').map(l => l.replace('package:', '')).filter(l => l);
    }
}

export default ADB;
