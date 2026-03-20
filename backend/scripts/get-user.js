const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGO_URI;
  const email = process.argv[2];
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(2);
  }
  if (!email) {
    console.error('Usage: node scripts/get-user.js <email>');
    process.exit(2);
  }

  const client = new MongoClient(uri, { connectTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGO_DB_NAME || 'school_management');
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(0);
    }
    // Mask password
    const out = { ...user };
    if (out.password) out.password = out.password.slice(0, 6) + '...';
    console.log(JSON.stringify(out, null, 2));
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
