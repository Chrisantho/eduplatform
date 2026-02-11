import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(import.meta.dirname, "..");

function log(message: string, source = "orchestrator") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

async function buildBackendIfNeeded(): Promise<void> {
  const jarPath = path.join(ROOT, "backend", "target", "eduplatform-backend-1.0.0.jar");
  if (fs.existsSync(jarPath)) {
    log("Backend JAR already exists, skipping build");
    return;
  }
  log("Building backend JAR...");
  return new Promise((resolve, reject) => {
    const mvn = spawn("mvn", ["package", "-DskipTests", "-q"], {
      cwd: path.join(ROOT, "backend"),
      stdio: "inherit",
    });
    mvn.on("close", (code) => {
      if (code === 0) {
        log("Backend JAR built successfully");
        resolve();
      } else {
        reject(new Error(`Maven build failed with code ${code}`));
      }
    });
  });
}

function startBackend(): ChildProcess {
  log("Starting Spring Boot backend on port 8080...");
  const jarPath = path.join(ROOT, "backend", "target", "eduplatform-backend-1.0.0.jar");
  const proc = spawn("java", ["-jar", jarPath], {
    cwd: path.join(ROOT, "backend"),
    stdio: "inherit",
    env: { ...process.env },
  });
  proc.on("error", (err) => log(`Backend error: ${err.message}`, "backend"));
  proc.on("close", (code) => log(`Backend exited with code ${code}`, "backend"));
  return proc;
}

function startFrontend(): ChildProcess {
  log("Starting Vite frontend dev server on port 5000...");
  const proc = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5000"], {
    cwd: path.join(ROOT, "frontend"),
    stdio: "inherit",
    env: { ...process.env },
  });
  proc.on("error", (err) => log(`Frontend error: ${err.message}`, "frontend"));
  proc.on("close", (code) => log(`Frontend exited with code ${code}`, "frontend"));
  return proc;
}

async function main() {
  await buildBackendIfNeeded();

  const backend = startBackend();
  const frontend = startFrontend();

  const cleanup = () => {
    log("Shutting down...");
    backend.kill();
    frontend.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
