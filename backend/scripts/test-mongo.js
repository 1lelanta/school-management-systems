const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || 'school_management';

  console.log('MONGO_URI present:', !!uri);
  console.log('MONGO_DB_NAME:', dbName);

  if (!uri) {
    console.error('MONGO_URI is not set. Set it in environment variables.');
    process.exit(2);
  }

  const client = new MongoClient(uri, { connectTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Connected to MongoDB, collections:', collections.map(c => c.name));
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Mongo connection failed:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
