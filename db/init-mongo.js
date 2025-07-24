db = db.getSiblingDB('clickcounter');

// Create user for the application
db.createUser({
  user: 'tiendat',
  pwd: 'dat123',
  roles: [
    {
      role: 'readWrite',
      db: 'clickcounter'
    }
  ]
});

db.createCollection('clicks');
db.clicks.insertOne({
  count: 0,
  lastUpdated: new Date()
}); 