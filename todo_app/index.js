const Koa = require("koa")
const serve = require("koa-static")
const path = require("path")
const fs = require("fs")
const axios = require("axios")

const app = new Koa()

const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const lastFetchedPath = path.join(directory, "pic_last_updated.txt")
const dailyPicPath = path.join(directory, "pic.jpg")

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const removeFile = async () =>
  new Promise((res) => fs.unlink(dailyPicPath, (err) => res()))

const makeDir = async () =>
  new Promise((res) => fs.mkdir(directory, (err) => res()))

const getPic = async () =>
  await axios.get("https://picsum.photos/1200", {
    responseType: "stream",
  })

const fetchNewPic = async () => {
  let picLastUpdated = null
  try {
    picLastUpdated = new Date(fs.readFileSync(lastFetchedPath))
  } catch {
    picLastUpdated = new Date()
    fs.writeFileSync(lastFetchedPath, picLastUpdated)
  }
  const now = new Date()
  if (!sameDay(picLastUpdated, now)) {
    await removeFile() // Remove old file, if exists
    await makeDir() // Create the dir, if doesn't exist
    const response = await getPic() // Get a new picture
    response.data.pipe(fs.createWriteStream(dailyPicPath)) // Save the picture
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
