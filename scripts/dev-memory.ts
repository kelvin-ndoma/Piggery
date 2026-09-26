import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const server = await MongoMemoryServer.create();
  const uri = server.getUri();
  await new Promise<void>((resolve, reject) => {
    const seed = spawn("npx", ["tsx", "scripts/seed.ts"], {
      env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "development", SEED_RESET: "true" },
      stdio: "inherit",
    });
    seed.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Seed exited with code ${code ?? "unknown"}`))));
  });

  const next = spawn("npx", ["next", "dev", "--port", "3000"], {
    env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "development" },
    stdio: "inherit",
  });

  async function shutdown() {
    next.kill("SIGTERM");
    await server.stop();
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
  next.on("exit", () => void shutdown());
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Could not start the demo server");
  process.exit(1);
});
