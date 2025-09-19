const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// Middleware per JSON (necessario per /add_email)
app.use(express.json());

// Serve file statici dalla cartella public
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render richiede SSL
});

// GET "/" ora serve il file index.html
app.get("/", async (req, res) => {

  fetch("https://bixit-ui.onrender.com").catch(err => console.error("❌ UI trigger failed:", err));
  fetch("https://bixit-server-0-1.onrender.com").catch(err => console.error("❌ Server trigger failed:", err));

  try {
    const nowResult = await pool.query("SELECT NOW()");
    const countResult = await pool.query("SELECT COUNT(1) FROM waiting_list");

    const dbMessage = `
      ✅ Connected to DB! Current time: ${nowResult.rows[0].now} <br>
      Waiting list count: ${countResult.rows[0].count}
    `;

    // Invia la pagina HTML con il messaggio nel placeholder
    const filePath = path.join(__dirname, "public", "index.html");
    let html = require("fs").readFileSync(filePath, "utf8");
    html = html.replace('Loading...', dbMessage);
    res.send(html);

  } catch (err) {
    console.error("❌ DB error:", err);
    res.send(`<p>Database connection failed: ${err.message}</p>`);
  }
});

// Endpoint per aggiungere email
app.post("/add_email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    await pool.query("INSERT INTO waiting_list(email, timestamp) VALUES($1, NOW())", [email]);
    res.json({ success: true, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
