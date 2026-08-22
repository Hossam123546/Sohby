const { neon } = require("@neondatabase/serverless");

function db(){
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL غير مضبوط في Vercel");
  return neon(process.env.DATABASE_URL);
}
module.exports = { db };