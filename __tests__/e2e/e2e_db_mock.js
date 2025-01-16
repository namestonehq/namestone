import postgres from "postgres";

const sql = postgres(process.env.TEST_DATABASE_URL, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});
export default sql;
