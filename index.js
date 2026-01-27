const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// ===== MySQL Connection =====
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) {
    console.log("DB ERROR:", err);
  } else {
    console.log("MySQL Connected");
  }
});

// ===== Test API =====
app.get("/", (req, res) => {
  res.send("Render + MySQL Connected (Mobile)");
});

// ===== SIGNUP API =====
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ status: "error", message: "All fields required" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name, email, hash],
    (err) => {
      if (err) {
        return res.json({ status: "error", message: "Email already exists" });
      }
      res.json({ status: "success", message: "Signup successful" });
    }
  );
});

// ===== LOGIN API =====
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ status: "error", message: "Email & password required" });
  }

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {

      if (result.length === 0) {
        return res.json({ status: "error", message: "User not found" });
      }

      const match = await bcrypt.compare(password, result[0].password);

      if (!match) {
        return res.json({ status: "error", message: "Wrong password" });
      }

      res.json({
        status: "success",
        message: "Login successful",
        name: result[0].name,
        email: result[0].email
      });
    }
  );
});

// ===== Server =====
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
