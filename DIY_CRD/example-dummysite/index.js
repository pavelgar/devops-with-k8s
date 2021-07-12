const axios = require("axios")
const express = require("express")

const PORT = process.env.PORT || 3000
const app = express()

const main = async () => {
  const { body } = await axios.get(process.argv[2])
  app.get("/", (req, res) => {
    res.send(body)
  })

  app.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`)
  })
}

main()
