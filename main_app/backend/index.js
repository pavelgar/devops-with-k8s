const path = require("path")
const fs = require("fs")

const directory = path.join("/", "usr", "src", "app", "files")
const filePath = path.join(directory, "timestamp.txt")

const genHash = () =>
  new Date().toISOString() +
  ": " +
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0
    let v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

const fileAlreadyExists = async () =>
  new Promise((res) => {
    fs.stat(filePath, (err, stats) => {
      if (err || !stats) return res(false)
      return res(true)
    })
  })

const createAFile = async () => {
  if (await fileAlreadyExists()) return

  await new Promise((res) => fs.mkdir(directory, (err) => res()))
  let hash = genHash()
  fs.writeFile(filePath, hash)
}

const removeFile = async () =>
  new Promise((res) => fs.unlink(filePath, (err) => res()))

createAFile()

const writeHash = () => {
  setTimeout(createAFile, 5000)
}

writeHash()
