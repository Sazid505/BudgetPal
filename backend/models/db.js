import mysql from "mysql2";

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "Sazid@2486",
  database: "budgetpal"
});

db.connect((err) => {
  if (err) console.error("DB connection failed:", err);
  else console.log("Connected to MySQL");
});

export default db;

