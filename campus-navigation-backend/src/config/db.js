const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  mongoURI: `${process.env.MONGODB_URI}${process.env.DB_NAME}`,
  dbName: process.env.DB_NAME
};
