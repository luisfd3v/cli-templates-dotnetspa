import net from 'node:net';

export async function isPortFree(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

/** Returns `preferred` when it is free, otherwise the next free port after it. */
export async function findFreePort(preferred: number): Promise<number> {
  for (let port = preferred; port < preferred + 200; port += 1) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  return ephemeralPort();
}

function ephemeralPort(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}
