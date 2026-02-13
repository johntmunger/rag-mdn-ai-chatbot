import "dotenv/config";
import * as fs from "fs";
import * as readline from "readline";
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
    console.log(
      `\n💓 [Heartbeat: Cache Reset - 5 more mins of 90% discount]`,
    );
    resetHeartbeat(summary);
  } catch (e) {
    console.log("\n⚠️ Heartbeat failed. Cache may expire.");
  }
}

function resetHeartbeat(summary: string) {
  clearTimeout(heartbeatTimer);
  heartbeatTimer = setTimeout(() => sendHeartbeat(summary), 4.5 * 60 * 1000);
}

async function chatWithProject() {
  const projectSummary = fs.readFileSync("./project-summary.md", "utf8");
  resetHeartbeat(projectSummary);

  console.log(`\n🤖 ARCHITECT LOADED. 90% Discount Heartbeat Active.`);

  const ask = () => {
    rl.question("\n👤 You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        clearTimeout(heartbeatTimer);
        return rl.close();
      }

      // Read the LATEST summary from the disk (in case Terminal 1 updated it)
      const latestSummary = fs.readFileSync("./project-summary.md", "utf8");
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

        const { cache_read_input_tokens } = response.usage;
        console.log(
          cache_read_input_tokens
            ? `[💎 90% SAVINGS APPLIED]`
            : `[🆕 CACHE INITIALIZED]`,
        );

        const content =
          response.content[0].type === "text" ? response.content[0].text : "";
        console.log(`\n🏛️ Claude: ${content}`);
        fs.writeFileSync('./LATEST_RESPONSE.md', content);

        // Show token usage for reference
        if (response.usage) {
          console.log(
            `\n[📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out]`,
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
