import * as edgedb from "edgedb";

// Create an EdgeDB client using instance and secret key from environment variables
const client = edgedb.createClient({
  host: process.env.EDGEDB_INSTANCE,
  password: process.env.EDGEDB_SECRET_KEY,
  database: "mydb", 
});

export default client;
