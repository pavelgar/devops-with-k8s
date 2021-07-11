const express = require("express")
const { Client } = require("pg")

const app = express()
const PORT = process.env.PORT || 3000

const client = new Client({
  host: "postgres-svc",
  port: 5432,
  user: "postgres",
  password: process.env.POSTGRES_PASSWORD,
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

// At this point either the database connection has been established or this app has crashed.
app.get("/healthz", (req, res) => {
  res.sendStatus(200)
})

app.get("/pingpong", async (req, res) => {
  const { rows } = await client.query(`SELECT n FROM Ping`)
  let pings = rows[0].n

  res.set("Content-type", "text/plain")
  res.send(`pong ${pings}`)
  pings++

  await client.query(`UPDATE Ping SET n=$1`, [pings])
})

app.get("/pingpong/pongs", async (req, res) => {
  const { rows } = await client.query(`SELECT n FROM Ping`)

  res.set("Content-type", "text/plain")
  res.send("" + rows[0].n)
})

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
