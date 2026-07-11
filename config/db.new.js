const mongoose = require('mongoose');

// If a query runs before Mongoose finishes connecting (or the connection
// never succeeds), fail it after 5s instead of hanging the request forever.
mongoose.set('bufferTimeoutMS', 5000);

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '[db] MONGODB_URI is not set. The site will still run, but the blog and ' +
      'consultation form will not be able to read/write data until you add a ' +
      'connection string to your .env file.'
    );
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    console.error('[db] Double-check MONGODB_URI in your .env file and that your IP is allow-listed in Atlas > Network Access.');
  }

  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err.message);
  });
}

module.exports = connectDB;
