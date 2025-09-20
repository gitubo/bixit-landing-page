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

app.get("/", (req, res) => {
  // 🔄 Pingo gli altri due servizi senza bloccare
  fetch("https://bixit-ui.onrender.com")
    .then(() => console.log("✅ UI pinged"))
    .catch(err => console.error("❌ UI trigger failed:", err));

  fetch("https://bixit-server-0-1.onrender.com")
    .then(() => console.log("✅ Server pinged"))
    .catch(err => console.error("❌ Server trigger failed:", err));

  // 🔄 Pingo il DB senza bloccare
  pool.query("SELECT NOW()")
    .then(result => {
      console.log("✅ DB ping success:", result.rows[0].now);
    })
    .catch(err => {
      console.error("❌ DB ping failed:", err.message);
    });

  // 📄 Rispondo subito servendo index.html senza attese
  const filePath = path.join(__dirname, "public", "index.html");
  res.sendFile(filePath);
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
