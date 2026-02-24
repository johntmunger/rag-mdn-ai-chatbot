import "dotenv/config";
import fs from "fs";
import path from "path";
import readline from "readline";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let heartbeatTimer: NodeJS.Timeout;

// 💓 The Heartbeat Function: Pings the cache to keep the discount alive
async function sendHeartbeat(summary: string) {
  try {
    await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1,
      system: [
        { type: "text", text: summary, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: "heartbeat" }],
    });
    console.log(`\n💓 [Heartbeat: Cache Reset - 5 more mins of 90% discount]`);
    resetHeartbeat(summary);
  } catch {
    console.log("\n⚠️ Heartbeat failed. Cache may expire.");
  }
}

function resetHeartbeat(summary: string) {
  clearTimeout(heartbeatTimer);
  heartbeatTimer = setTimeout(() => sendHeartbeat(summary), 4.5 * 60 * 1000);
}

async function chatWithProject() {
  const projectSummaryPath = path.join(process.cwd(), "project-summary.md");
  if (!fs.existsSync(projectSummaryPath)) {
    console.error(
      `❌ Error: project-summary.md not found at ${projectSummaryPath}`,
    );
    process.exit(1);
  }
  const projectSummary = fs.readFileSync(projectSummaryPath, "utf8");
  resetHeartbeat(projectSummary);

  console.log(`\n🤖 ARCHITECT LOADED. 90% Discount Heartbeat Active.`);

  const ask = () => {
    rl.question("\n👤 You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        clearTimeout(heartbeatTimer);
        return rl.close();
      }

      // Read the LATEST summary from the disk (in case Terminal 1 updated it)
      const latestSummaryPath = path.join(process.cwd(), "project-summary.md");
      if (!fs.existsSync(latestSummaryPath)) {
        console.error(
          `❌ Error: project-summary.md not found at ${latestSummaryPath}`,
        );
        return ask();
      }
      const latestSummary = fs.readFileSync(latestSummaryPath, "utf8");
      resetHeartbeat(latestSummary);

      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: [
            {
              type: "text",
              text: latestSummary,
              cache_control: { type: "ephemeral" }, // THIS IS THE MONEY SAVER
            },
          ],
          messages: [{ role: "user", content: input }],
        });

        const cacheReadTokens = response.usage?.cache_read_input_tokens ?? 0;
        console.log(
          cacheReadTokens > 0
            ? `[💎 90% SAVINGS APPLIED]`
            : `[🆕 CACHE INITIALIZED]`,
        );

        const content =
          response.content[0]?.type === "text" ? response.content[0].text : "";
        console.log(`\n🏛️ Claude: ${content}`);
        const responsePath = path.join(process.cwd(), "LATEST_RESPONSE.md");
        fs.writeFileSync(responsePath, content);

        // Show token usage for reference
        if (response.usage) {
          const cacheInfo =
            cacheReadTokens > 0 ? ` (${cacheReadTokens} from cache)` : "";
          console.log(
            `\n[📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out${cacheInfo}]`,
          );
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`❌ Error: ${error.message}`);
      }

      ask();
    });
  };
  ask();
}

chatWithProject();
