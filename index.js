const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection (external)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) console.log("DB Error:", err);
  else console.log("DB Connected");
});

/* ================= SIGNUP API ================= */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  db.query(
    "SELECT id FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) return res.json({ success: false, message: "Database error" });

      if (result.length > 0) {
        return res.json({ success: false, message: "Email already registered" });
      }

      const hash = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (name,email,password) VALUES (?,?,?)",
        [name, email, hash],
        err2 => {
          if (err2) return res.json({ success: false, message: "Signup failed" });

          return res.json({
            success: true,
            message: "Signup successful"
          });
        }
      );
    }
  );
});

/* ================= LOGIN API ================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "All fields are required" });
  }

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) return res.json({ success: false, message: "Database error" });

      if (result.length === 0) {
        return res.json({ success: false, message: "User not found" });
      }

      const match = await bcrypt.compare(password, result[0].password);

      if (!match) {
        return res.json({ success: false, message: "Wrong password" });
      }

      return res.json({
        success: true,
        message: "Login successful",
        user: {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email
        }
      });
    }
  );
});

// Server start
app.listen(PORT, () => {
  console.log("API running on port", PORT);
});
