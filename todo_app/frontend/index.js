const express = require("express")
const path = require("path")
const fs = require("fs")
const axios = require("axios")

const app = express()
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

const fetchNewPic = async (current) => {
  const now = new Date()
  if (!current || !sameDay(current, now)) {
    await removeFile() // Remove old file, if exists
    await makeDir() // Create the dir, if doesn't exist
    const response = await axios.get("https://picsum.photos/200", {
      responseType: "stream",
    })
    response.data.pipe(fs.createWriteStream(dailyPicPath))
  }
}

const updatePic = async () => {
  let picLastUpdated = null
  try {
    picLastUpdated = new Date(fs.readFileSync(lastFetchedPath))
    await fetchNewPic(picLastUpdated)
  } catch {
    await fetchNewPic(null)
    picLastUpdated = new Date()
    fs.writeFileSync(lastFetchedPath, "" + picLastUpdated)
  }
}

app.use(express.static(directory))

app.get("/", async (req, res) => {
  // Get a new image
  await updatePic()
  // Send response
  res.sendFile(path.join(__dirname, "/index.html"))
})

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
