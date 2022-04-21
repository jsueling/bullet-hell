const mongoose = require('mongoose')

const { MONGODB_URI } = require('../utils/config')

mongoose.connect(MONGODB_URI)
  .then(() => console.log('connected to MongoDB'))
  .catch((e) => console.log(e))

const scoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model('Score', scoreSchema)