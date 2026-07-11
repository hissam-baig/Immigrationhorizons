const mongoose = require('mongoose');

// If a query runs before Mongoose finishes connecting (or the connection
// never succeeds), fail it after 5s instead of hanging the request forever.
mongoose.set('bufferTimeoutMS', 5000);

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<') || uri.includes('>')) {
    console.warn(
      '[db] MONGODB_URI is not set (or still contains the <placeholder> values from .env.example). ' +
      'The site will still run, but the blog and consultation form will not be able to read/write ' +
      'data until you add a real MongoDB Atlas connection string to your .env file.'
    );
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('[db] Connected to MongoDB Atlas');

    mongoose.connection.on('error', (err) => {
      console.error('[db] MongoDB connection error:', err.message);
    });
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    console.error('[db] Double-check MONGODB_URI in your .env file and that your IP is allow-listed in Atlas > Network Access.');
  }
}

module.exports = connectDB;
