require('dotenv').config();
const mongodb = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyparser = require("body-parser")
const app=express();

app.use(cors());
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./Model')

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}))

mongodb.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
  .then(() => {
      console.log('Connected to MongoDB successfully!');
  })
  .catch((err) => {
      console.error('Error connecting to MongoDB: ' + err);
  });



const port = 5000;

app.listen(port,()=>{
    console.log("Server started on port " + port + ", waiting for requests ...");
})