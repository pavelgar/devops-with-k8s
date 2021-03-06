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

const writeHash = async () =>
  await fs.mkdir(directory, { recursive: true }, (err) => {
    const hash = genHash()
    fs.writeFile(filePath, hash, (err) => {
      if (err) throw err
      console.log("Hash file updated!")
    })
  })

const main = () => {
  writeHash()
  setTimeout(main, 5000)
}

main()
