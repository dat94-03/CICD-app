// Get database name from environment variable
const dbName = process.env.MONGO_INITDB_DATABASE || 'clickcounter';
const username = process.env.MONGO_INITDB_ROOT_USERNAME || 'admin';
const password = process.env.MONGO_INITDB_ROOT_PASSWORD || 'password';

db = db.getSiblingDB(dbName);

// Create user for the application
db.createUser({
  user: username,
  pwd: password,
  roles: [
    {
      role: 'readWrite',
      db: dbName
    }
  ]
});

db.createCollection('clicks');
db.clicks.insertOne({
  count: 0,
  lastUpdated: new Date()
}); 