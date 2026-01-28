const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

// ================= DB CONFIG =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000
});

// ================= DB CONNECT =================
db.connect((err) => {
  if (err) {
    console.log("❌ DB Connection Failed");
    console.log(err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running"
  });
});

// ================= SIGNUP =================
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({
      success: false,
      message: "All fields are required"
    });
  }

  const sql =
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

  db.query(sql, [name, email, password], (err) => {
    if (err) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    res.json({
      success: true,
      message: "Signup successful"
    });
  });
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "All fields are required"
    });
  }

  const sql =
    "SELECT id, name, email FROM users WHERE email=? AND password=?";

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      return res.json({
        success: false,
        message: "Database error"
      });
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: result[0]
    });
  });
});

// ================= PORT =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
