const express = require("express")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const filePath = path.join(directory, "pings.txt")
let ping_count = 0

app.get("/", (req, res) => {
  res.send(`pong ${ping_count}`)
  fs.writeFileSync(filePath, ++ping_count + "")
})

fs.mkdirSync(directory, { recursive: true })
fs.writeFileSync(filePath, ping_count + "")

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
