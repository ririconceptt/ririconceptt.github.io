import express from "express";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("./db.sqlite");

// Crear tablas si no existen
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    image TEXT,
    stock INTEGER
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  )
`);

// Crear usuario admin único si no existe
db.get("SELECT * FROM admin WHERE username = 'admin'", async (_, row) => {
  if (!row) {
    const hash = await bcrypt.hash("123456", 10);
    db.run("INSERT INTO admin (username, password) VALUES (?, ?)", [
      "admin",
      hash,
    ]);
    console.log("Admin creado: admin / 123456");
  }
});

// JWT middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    req.user = jwt.verify(token, "secreto");
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admin WHERE username = ?", [username], async (_, row) => {
    if (!row) return res.status(400).json({ error: "Usuario no existe" });

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: row.id, username }, "secreto");
    res.json({ token });
  });
});

// GET productos
app.get("/products", (_, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    res.json(rows);
  });
});

// Crear producto (admin)
app.post("/products", auth, (req, res) => {
  const { name, price, image, stock } = req.body;
  db.run(
    "INSERT INTO products (name, price, image, stock) VALUES (?, ?, ?, ?)",
    [name, price, image, stock],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

// Actualizar stock
app.post("/products/:id/stock", auth, (req, res) => {
  const { amount } = req.body; // puede ser negativo
  db.run(
    "UPDATE products SET stock = stock + ? WHERE id = ?",
    [amount, req.params.id],
    function () {
      res.json({ updated: true });
    }
  );
});

// BORRAR producto
app.delete("/products/:id", auth, (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function () {
    res.json({ deleted: true });
  });
});

// Puerto para Render / Railway
app.listen(process.env.PORT || 3000, () =>
  console.log("Backend andando en puerto 3000")
);
