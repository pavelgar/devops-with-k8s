const Koa = require("koa")
const path = require("path")
const fs = require("fs")

const app = new Koa()
const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const filePath = path.join(directory, "pings.txt")
let ping_count = 0

app.use(async (ctx) => {
  if (ctx.path.includes("favicon.ico")) return
  ctx.body = `pong ${ping_count}`
  fs.writeFileSync(filePath, ++ping_count + "")
})

fs.mkdirSync(directory, { recursive: true })
fs.writeFileSync(filePath, ping_count + "")
app.listen(PORT)
