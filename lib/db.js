import postgres from "postgres";

console.log(`#### DEBUG in lib/db.js ####`);
console.log(process.env.POSTGRES_URI);
console.log(`#### DEBUG in lib/db.js ####`);
const sql = postgres(process.env.POSTGRES_URI, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});
export default sql;
