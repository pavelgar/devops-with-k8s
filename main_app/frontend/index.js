const Koa = require("koa")
const path = require("path")
const fs = require("fs")

const app = new Koa()
const PORT = process.env.PORT || 3000

const directory = path.join("/", "usr", "src", "app", "files")
const timestampFile = path.join(directory, "timestamp.txt")
const pingFile = path.join(directory, "pings.txt")

app.use(async (ctx) => {
  if (ctx.path.includes("favicon.ico")) return

  ctx.body =
    fs.readFileSync(timestampFile, "utf8") +
    "\nPing / Pongs: " +
    fs.readFileSync(pingFile, "utf8")
  ctx.set("Content-type", "text/plain")
  ctx.status = 200
})

app.listen(PORT)
