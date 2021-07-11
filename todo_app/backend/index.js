const express = require("express")
const { Client } = require("pg")
const NATS = require("nats")

const MAX_TODO_LEN = 140
const PORT = process.env.PORT || 3000

const nc = NATS.connect({ url: process.env.NATS_URL || "nats://nats:4222" })
const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const client = new Client({
  host: "postgres-svc",
  port: 5432,
  user: "postgres",
  password: process.env.POSTGRES_PASSWORD,
  database: "postgres",
})

client.connect()

client.query(
  `CREATE TABLE IF NOT EXISTS Todos (
        id SERIAL PRIMARY KEY,
        task VARCHAR(${MAX_TODO_LEN}) NOT NULL,
        done BOOLEAN DEFAULT false
  )`
)

// At this point either the database connection has been established or this app has crashed.
app.get("/", (req, res) => {
  res.sendStatus(200)
})

app
  .route("/todos")
  .get(async (req, res) => {
    const { rows } = await client.query(`SELECT task FROM Todos`)
    res.json(rows)
  })
  .post(async (req, res) => {
    const { todo } = req.body
    if (todo && todo.length <= MAX_TODO_LEN) {
      const [q] = await client.query("INSERT INTO Todos(task) VALUES($1)", [
        todo,
      ])
      console.log("New todo item added:\n" + q.task)
      nc.publish("todos", JSON.stringify(q))
      res.sendStatus(200)
    } else {
      res.sendStatus(400)
    }
  })

app.put("/todos/:id", async (req, res) => {
  const { id } = req.params
  try {
    const [q] = await client.query(
      "UPDATE Todos SET done = true WHERE id = $1",
      [id]
    )
    console.log(`Todo #${id} has been marked as done!`)
    nc.publish("todos", JSON.stringify(q))
    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(400)
  }
})

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
