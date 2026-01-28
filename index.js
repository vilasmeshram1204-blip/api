const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS allow mobile apps
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// External MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

db.connect((err) => {
  if (err) console.error("DB connection failed:", err);
  else console.log("Connected to external MySQL DB");
});

// Signup route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    // Check if email exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.json({ success: false, message: "Database error" });

      if (results.length > 0) {
        return res.json({ success: false, message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err2) => {
          if (err2) return res.json({ success: false, message: "Database error" });

          return res.json({ success: true, message: "Signup successful" });
        }
      );
    });
  } catch (error) {
    return res.json({ success: false, message: "Server error" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Render Signup API running on port ${PORT}`));
