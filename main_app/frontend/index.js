const Koa = require("koa")
const path = require("path")
const fs = require("fs")

const app = new Koa()
const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const filePath = path.join(directory, "timestamp.txt")

const getFile = async () =>
  new Promise((res) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err)
        return console.log("FAILED TO READ FILE", "----------------", err)
      res(buffer)
    })
  })

app.use(async (ctx) => {
  if (ctx.path.includes("favicon.ico")) return
  ctx.body = await getFile()
  ctx.set("Content-disposition", "attachment; filename=timestamp.txt")
  ctx.set("Content-type", "text/plain")
  ctx.status = 200
})

app.listen(PORT)
