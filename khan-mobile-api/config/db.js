const mongoose = require('mongoose');

const connect = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    // Mongoose 7+ doesn't need useNewUrlParser/useUnifiedTopology anymore —
    // they're the default and passing them just prints a deprecation warning.
  });
};

module.exports = { mongoose, connect };
