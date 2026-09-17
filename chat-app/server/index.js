require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
