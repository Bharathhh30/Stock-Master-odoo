require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


// dummy , have to change accordingly
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stockmaster_dev';
console.log(MONGO_URI)

const app = express();
app.use(cors());
app.use(express.json());

// checking health
app.get("/api/v1/health",(req,res)=>{
    res.json({status: 'ok', time: new Date().toISOString() })
})

// basic DB connect
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(' MongoDB connected');
  } catch (err) {
    console.error(' MongoDB connection error:', err.message);
    // still start server so health endpoint works for now (useful if dev DB not ready)
  }

  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
  });
}

start();