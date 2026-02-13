import chokidar from "chokidar";
import { exec } from "child_process";
import path from "path";

// CONFIG: Watch your source folder
const watchPath = path.resolve(__dirname, "./src");
let isRefreshing = false;

console.log(`👀 Watch Mode Active: Monitoring ${watchPath}...`);

const watcher = chokidar.watch(watchPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true, // don't run on start, only on changes
});

watcher.on("change", (filePath) => {
  if (isRefreshing) return; // Prevent "looping" if multiple files save at once

  isRefreshing = true;
  console.log(`\n📝 Change detected: ${path.basename(filePath)}`);
  console.log(`🔄 Updating Haiku Summary for Tier 2 Cache...`);

  // Run your crawl script automatically
  exec("npx tsx crawl.ts", (error) => {
    if (error) {
      console.error(`❌ Sync Error: ${error.message}`);
    } else {
      console.log(
        `✅ Cache Updated! Your next Sonnet question will use the new code.`,
      );
    }

    // Cool down for 3 seconds to avoid spamming the API while typing
    setTimeout(() => {
      isRefreshing = false;
    }, 3000);
  });
});
