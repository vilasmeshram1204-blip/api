const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

// ================= DB =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB Connection Failed", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ================= EMAIL VALIDATOR =================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  // 1️⃣ All fields check
  if (!name || !email || !password || !confirm_password) {
    return res.json({
      success: false,
      message: "All fields are required"
    });
  }

  // 2️⃣ Email validation
  if (!isValidEmail(email)) {
    return res.json({
      success: false,
      message: "Invalid email format"
    });
  }

  // 3️⃣ Password length
  if (password.length < 6) {
    return res.json({
      success: false,
      message: "Password must be at least 6 characters"
    });
  }

  // 4️⃣ Confirm password
  if (password !== confirm_password) {
    return res.json({
      success: false,
      message: "Passwords do not match"
    });
  }

  // 5️⃣ Check existing email
  db.query(
    "SELECT id FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) {
        return res.json({
          success: false,
          message: "Database error"
        });
      }

      if (result.length > 0) {
        return res.json({
          success: false,
          message: "Email already registered"
        });
      }

      // 6️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 7️⃣ Insert user
      db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err) => {
          if (err) {
            return res.json({
              success: false,
              message: "Signup failed"
            });
          }

          // ✅ SUCCESS MESSAGE (GUARANTEED)
          res.json({
            success: true,
            message: "Signup successful"
          });
        }
      );
    }
  );
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

  if (!isValidEmail(email)) {
    return res.json({
      success: false,
      message: "Invalid email format"
    });
  }

  db.query(
    "SELECT id, name, email, password FROM users WHERE email=?",
    [email],
    async (err, result) => {
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

      const isMatch = await bcrypt.compare(
        password,
        result[0].password
      );

      if (!isMatch) {
        return res.json({
          success: false,
          message: "Invalid email or password"
        });
      }

      res.json({
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

// ================= PORT =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
