const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // middleware per leggere JSON dal body

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Endpoint test DB
app.get("/", async (req, res) => {
  let dbMessage = "";

  try {
    const nowResult = await pool.query("SELECT NOW()");
    const now = nowResult.rows[0].now;

    const countResult = await pool.query("SELECT COUNT(1) AS total FROM waiting_list");
    const total = countResult.rows[0].total;

    dbMessage = `
      ✅ Connected to DB!<br>
      🕒 Current time: ${now}<br>
      📊 waiting_list entries: ${total}
    `;
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

// 🔹 Endpoint per aggiungere email
app.post("/add_email", async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const query = `
      INSERT INTO waiting_list (email, created_at)
      VALUES ($1, NOW())
      RETURNING id, email, created_at
    `;
    const result = await pool.query(query, [email]);

    res.json({
      success: true,
      message: "Email added successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Insert error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

const server = app.listen(port, () => console.log(`App listening on port ${port}!`));
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
