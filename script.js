const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.db");
db.get("SELECT id, name, username, email, created_at FROM users WHERE username = ?", ["PruebaUsuario"], (err,row)=>{
  if(err){ console.error("ERROR", err.message); process.exit(1);} 
  console.log(JSON.stringify(row));
  db.close();
});
