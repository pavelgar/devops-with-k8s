require("dotenv").config({ path: "./envs/.env" })

const express = require("express")
const app = express()
const PORT = process.env.PORT || 3000

const { Client } = require("pg")

const postgresPass = Buffer.from(
  process.env.POSTGRES_PASSWORD,
  "base64"
).toString("utf-8")

const client = new Client({
  host: "postgres-ss-0.default",
  port: 5432,
  user: "postgres",
  password: postgresPass,
  database: "postgres",
})

client.connect()

// Check if table already exists, otherwise create the table.
client
  .query(`SELECT n FROM Ping`)
  .catch((err) =>
    client
      .query(`CREATE TABLE Ping(n int DEFAULT 0)`)
      .then((res) => client.query("INSERT INTO Ping(n) VALUES($1)", [0]))
  )

app.get("/", async (req, res) => {
  const { rows } = await client.query(`SELECT n FROM Ping`)
  let pings = parseInt(rows[0])
  res.send(`pong ${pings}`)
  pings++
  await client.query(`UPDATE Ping SET n=$1`, [pings])
})

app.get("/pongs", (req, res) => {
  const { rows } = client.query(`SELECT n FROM Ping`)
  res.send(rows[0])
})

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
