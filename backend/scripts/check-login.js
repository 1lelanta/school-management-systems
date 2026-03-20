const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGO_URI;
  const email = process.argv[2];
  const password = process.argv[3];
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(2);
  }
  if (!email || !password) {
    console.error('Usage: node scripts/check-login.js <email> <password>');
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
    const ok = bcrypt.compareSync(password, user.password);
    console.log('Password match:', ok);
    await client.close();
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
