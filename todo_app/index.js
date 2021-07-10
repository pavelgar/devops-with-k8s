const Koa = require("koa")
const serve = require("koa-static")
const path = require("path")
const fs = require("fs")
const axios = require("axios")

const app = new Koa()

const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const dailyPicPath = path.join(directory, "pic.jpg")
let picLastUpdated = null

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const removeFile = async () =>
  new Promise((res) => fs.unlink(dailyPicPath, (err) => res()))

const fetchNewPic = async () => {
  const now = new Date()
  if (!picLastUpdated || !sameDay(picLastUpdated, now)) {
    await removeFile()
    await new Promise((res) => fs.mkdir(directory, (err) => res()))
    const response = await axios.get("https://picsum.photos/1200", {
      responseType: "stream",
    })
    response.data.pipe(fs.createWriteStream(dailyPicPath))
  }
}

app.use(serve(directory))
app.use(async (ctx) => {
  if (ctx.path.includes("favicon.ico")) return
  // Get a new image
  fetchNewPic()
  // Send response
  ctx.body = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Todo App</title>
      <!-- <link rel="stylesheet" href="style.css" /> -->
      <!-- <script src="script.js"></script> -->
    </head>
    <body>
      <h1>Hello, World!</h1>
      <img src="./pic.jpg" alt="Daily pic!">
    </body>
  </html>
  `
  ctx.status = 200
})

fetchNewPic()
app.listen(PORT)
