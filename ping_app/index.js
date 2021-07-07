const express = require("express")

const app = express()
const port = process.env.PORT || 3000

let ping_count = 0

app.get("/", (req, res) => {
  res.send(`pong ${ping_count}`)
  ping_count++
})

app.listen(port)
