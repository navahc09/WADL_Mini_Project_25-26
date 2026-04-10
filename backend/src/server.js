const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const { query } = require("./db");
const { startCronJobs } = require("./jobs/cronJobs");

const port = Number(process.env.PORT || 5000);

async function start() {
  await query("SELECT 1");

  app.listen(port, () => {
    console.log(`TNP backend listening on http://localhost:${port}`);
    startCronJobs();
  });
}

start().catch((error) => {
  console.error("[startup] failed to initialize backend", error);
  process.exit(1);
});
