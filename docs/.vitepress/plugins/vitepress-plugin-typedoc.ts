import { Plugin } from "@vitejs/plugin-vue/node_modules/vite";
import path from "path";
import { ChildProcess, spawn } from "child_process";

export function vitepressPluginTypedoc(): Plugin {
  const typedoc = path.resolve(__dirname, "../../../node_modules/.bin/typedoc");
  const childProcesses: ChildProcess[] = [];

  return {
    name: "vitepress-plugin-typedoc",
    async buildStart(options) {
      await new Promise((resolve, reject) => {
        console.log("typedoc: building docs...");

        const childProcess = spawn(typedoc);
        childProcess.stdout.on("data", (data) => {
          console.log(`typedoc: ${data}`);
        });
        childProcess.stderr.on("data", (data) => {
          console.error(`typedoc: ${data}`);
        });
        childProcess.on("close", (code) => {
          if (code === 0) {
            resolve(undefined);
          } else {
            reject();
          }
        });
        childProcesses.push(childProcess);
      });
    },
    async configureServer(server) {
      for (const childProcess of childProcesses) {
        childProcess.kill();
      }

      const childProcess = spawn(typedoc, ["--watch"]);
      childProcess.stdout.on("data", (data) => {
        console.log(`typedoc: ${data}`);
      });
      childProcess.stderr.on("data", (data) => {
        console.error(`typedoc: ${data}`);
      });
      childProcesses.push(childProcess);
    },
    async closeBundle() {
      for (const childProcess of childProcesses) {
        childProcess.kill();
      }
    },
  };
}
