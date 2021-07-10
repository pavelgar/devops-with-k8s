require("dotenv").config()

const express = require("express")
const axios = require("axios")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const timestampFile = path.join(directory, "timestamp.txt")

app.get("/", async (req, res) => {
  try {
    const ts = fs.readFileSync(timestampFile, "utf8")
    const pings = await axios.get("http://ping-service/pongs")

    res.set("Content-type", "text/plain")
    res.send(process.env.MESSAGE + "\n" + ts + ".\nPing / Pongs: " + pings.data)
  } catch (error) {
    res.status(500).send(error)
  }
})

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
