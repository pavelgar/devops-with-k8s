const axios = require("axios")
const NATS = require("nats")

const GENERIC_URL = process.env.GENERIC_URL
const nc = NATS.connect({ url: process.env.NATS_URL || "nats://nats:4222" })

nc.subscribe("todos", { queue: "broadcaster.workers" }, async (msg) => {
  const payload = JSON.parse(msg)
  const { index, data } = payload
  console.log(`Received package #${index} of length: ${data.length}`)
  await axios.post(GENERIC_URL, { user: "bot", ...data })
  console.log(`Package #${index} was broadcasted succesfully!`)
  nc.publish("processed_data", String(index))
})

console.log("Broadcaster listening")
