const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = process.env.PORT || 3001;
const dbUrl = process.env.DATABASE_URL || "not set";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render richiede SSL
});

app.get("/", async (req, res) => {
  let dbMessage = "";

  try {
    const result = await pool.query("SELECT NOW()");
    dbMessage = `✅ Connected to DB! Current time: ${result.rows[0].now}`;
  } catch (err) {
    console.error("❌ DB error:", err);
    dbMessage = `❌ Database connection failed: ${err.message}`;
  }

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Hello from Render + DB</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; }
        section { margin-bottom: 1rem; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>Hello from Render! 🎉</h1>
      <section>
        <h2>Database Test</h2>
        <p>${dbMessage}</p>
      </section>
    </body>
  </html>
  `;
  res.type("html").send(html);
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;


