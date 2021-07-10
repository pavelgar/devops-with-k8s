const express = require("express")

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const PORT = process.env.PORT || 3000
const TODOS = []

app
  .route("/todos")
  .get((req, res) => {
    res.json(TODOS)
  })
  .post((req, res) => {
    const todo_item = req.body.todo
    if (todo_item) {
      TODOS.push(todo_item)
      res.sendStatus(200)
    } else {
      res.sendStatus(401)
    }
  })

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
