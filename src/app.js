const express = require('express')
const app = express()
const cors = require('cors')

const { MONGODB_URI, PORT } = require('../utils/config')
const Score = require('../models/score')

app.use(cors())

// heroku auto runs build script during node deploys https://devcenter.heroku.com/changelog-items/1557
app.use(express.static('dist'))

app.get('/api/scores', (req, res) => {
  res.send('Scores') // TODO
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})