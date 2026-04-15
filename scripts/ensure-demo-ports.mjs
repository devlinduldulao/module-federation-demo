import net from "node:net";

const demoPorts = [
  { port: 3000, name: "shell" },
  { port: 3001, name: "products" },
  { port: 3002, name: "cart" },
  { port: 3003, name: "dashboard" },
];

function inspectPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE") {
        resolve({ port, available: false });
        return;
      }

      resolve({
        port,
        available: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    server.once("listening", () => {
      server.close(() => {
        resolve({ port, available: true });
      });
    });

    server.listen(port);
  });
}

const results = await Promise.all(demoPorts.map(({ port }) => inspectPort(port)));
const occupiedPorts = results.filter((result) => !result.available);

if (occupiedPorts.length === 0) {
  console.log("All demo ports are available: 3000, 3001, 3002, 3003.");
  process.exit(0);
}

console.error("Microfrontend demo ports are not all available.");

for (const result of occupiedPorts) {
  const app = demoPorts.find(({ port }) => port === result.port);
  const reason = result.error ? ` (${result.error})` : "";
  console.error(`- Port ${result.port} (${app?.name ?? "unknown"}) is already in use${reason}`);
}

console.error("Free those ports or stop the existing dev servers before running npm run dev.");
process.exit(1);