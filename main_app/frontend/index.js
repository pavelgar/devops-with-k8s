const Koa = require("koa")
const path = require("path")
const fs = require("fs")

const app = new Koa()
const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const filePath = path.join(directory, "timestamp.txt")

app.use(async (ctx) => {
  if (ctx.path.includes("favicon.ico")) return

  ctx.body = await fs.readFile(filePath, (err, buffer) =>
    err ? console.log("FAILED TO READ FILE", "--------------\n", err) : buffer
  )
  ctx.set("Content-disposition", "attachment; filename=timestamp.txt")
  ctx.set("Content-type", "text/plain")
  ctx.status = 200
})

app.listen(PORT)
