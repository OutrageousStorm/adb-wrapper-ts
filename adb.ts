/**
 * adb.ts -- TypeScript ADB wrapper with promise-based API
 * Usage:
 * import ADB from "./adb"
 * const adb = new ADB()
 * const devices = await adb.devices()
 * await adb.shell("pm list packages")
 */

import { execSync, spawn } from "child_process"

export default class ADB {
  private adbPath: string = "adb"

  constructor(adbPath?: string) {
    if (adbPath) this.adbPath = adbPath
  }

  async devices(): Promise<string[]> {
    const out = execSync(`${this.adbPath} devices`).toString()
    return out
      .split("\n")
      .filter((l) => l.includes("device") && !l.startsWith("List"))
      .map((l) => l.split("\t")[0])
  }

  async shell(cmd: string, device?: string): Promise<string> {
    const target = device ? `-s ${device}` : ""
    const out = execSync(`${this.adbPath} ${target} shell ${cmd}`).toString()
    return out.trim()
  }

  async push(src: string, dst: string, device?: string): Promise<void> {
    const target = device ? `-s ${device}` : ""
    execSync(`${this.adbPath} ${target} push ${src} ${dst}`)
  }

  async pull(src: string, dst: string, device?: string): Promise<void> {
    const target = device ? `-s ${device}` : ""
    execSync(`${this.adbPath} ${target} pull ${src} ${dst}`)
  }

  async install(apk: string, device?: string): Promise<void> {
    const target = device ? `-s ${device}` : ""
    execSync(`${this.adbPath} ${target} install ${apk}`)
  }

  async reboot(device?: string): Promise<void> {
    const target = device ? `-s ${device}` : ""
    execSync(`${this.adbPath} ${target} reboot`)
  }
}
