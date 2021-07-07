const express = require("express")

const app = express()
const port = process.env.PORT || 3000

const genHash = () =>
  new Date().toISOString() +
  ": " +
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0
    let v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

let CURRENT_HASH = genHash()

app.get("/status", (req, res) => {
  res.send(CURRENT_HASH)
})

app.listen(port)

const printHash = () => {
  CURRENT_HASH = genHash()
  console.log(CURRENT_HASH)
  setTimeout(printHash, 5000)
}

printHash()
