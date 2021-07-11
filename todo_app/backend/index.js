const express = require("express")
const { Client } = require("pg")

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const PORT = process.env.PORT || 3000
const MAX_TODO_LEN = 140

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
        task VARCHAR(${MAX_TODO_LEN}) NOT NULL
  )`
)

app.get("/", (req, res) => {
  res.sendStatus(200)
})

app
  .route("/todos")
  .get(async (req, res) => {
    const { rows } = await client.query(`SELECT task FROM Todos`)
    res.json(rows.map((row) => row.task))
  })
  .post(async (req, res) => {
    const todoItem = req.body.todo
    if (todoItem && todoItem.length <= MAX_TODO_LEN) {
      await client.query("INSERT INTO Todos(task) VALUES($1)", [todoItem])
      res.sendStatus(200)
    } else {
      res.sendStatus(401)
    }
  })

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
