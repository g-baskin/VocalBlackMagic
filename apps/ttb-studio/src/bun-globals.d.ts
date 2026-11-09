// Minimal typing for the Bun runtime APIs this server uses (the app always runs under Bun).
declare global {
  interface BunSubprocess {
    readonly stderr: ReadableStream<Uint8Array>;
    readonly stdout: ReadableStream<Uint8Array>;
    readonly exited: Promise<number>;
    kill(): void;
  }
  interface BunFile extends Blob {
    readonly size: number;
    exists(): Promise<boolean>;
    slice(start?: number, end?: number): Blob;
  }
  const Bun: {
    spawn(cmd: string[], options: { stdout: 'ignore' | 'pipe'; stderr: 'pipe' }): BunSubprocess;
    file(path: string): BunFile;
    write(path: string, data: Response | Blob | Uint8Array | string): Promise<number>;
    which(command: string): string | null;
  };
}
export {};
