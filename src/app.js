const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.static('dist'))

app.get('/api/score', (req, res) => {
  res.send('Scores') // TODO
})

app.listen(8000, () => {
  console.log(`Listening on port ${8000}`)
})