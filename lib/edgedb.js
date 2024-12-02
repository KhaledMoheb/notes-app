import * as edgedb from "edgedb";

// Create an EdgeDB client using instance and secret key from environment variables
const client = edgedb.createClient({
  instance: process.env.EDGEDB_INSTANCE, // The EdgeDB instance name (e.g., "vercel-OxormxBYhlRWOdo4r2pYvNm6/edgedb-green-dog")
  secretKey: process.env.EDGEDB_SECRET_KEY, // Your secret key
});

export default client;
