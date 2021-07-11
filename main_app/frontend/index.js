require("dotenv").config({ path: "./envs/.env" })

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
    const pings = await axios.get("http://ping-svc/pongs")

    res.set("Content-type", "text/plain")
    res.send(process.env.MESSAGE + "\n" + ts + ".\nPing / Pongs: " + pings.data)
  } catch (error) {
    res.status(500).send(error)
  }
})

// At this point either the database connection has been established or this app has crashed.
app.get("/healthz", async (req, res) => {
  const pings = await axios.get("http://ping-svc/pongs")
  if (pings.status == 200) {
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
