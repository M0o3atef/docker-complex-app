const keys = require("./keys")
const cors = require("cors")
const express = require("express")
const redis = require("redis")
const bodyParser = require("body-parser")

const { Pool } = require("pg")


const app = express()
app.use(cors())
app.use(bodyParser.json())

const pgClient = new Pool({
    user: keys.pgUser,
    password: keys.pgPassword,
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDB,
    ssl: process.env.NODE_ENV !== 'production'
        ? false
        : { rejectUnauthorized: false }
})


pgClient.on("connect", (client) => {
    client
      .query('CREATE TABLE IF NOT EXISTS values (number INT)')
      .catch((err) => console.error(err));
});


const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
})

redisPublisher = redisClient.duplicate()

app.get("/", (req, res) => {
    res.send("Hi")
})

app.get("/values/all", async (req, res) => {
    const values = await pgClient.query("Select * from values")
    res.send(values.rows)
})

app.get("/values/current", async (req, res) => {
    redisClient.hgetall("values", (err, values) => {
        res.send(values)
    })
})

app.post("/values", async(req, res) => {
    const index = req.body.index
    if(parseInt(index) > 40){
        res.status(422).send("index too high")
    }

    redisClient.hset("values", index, "nothing yet")
    redisPublisher.publish("insert", index)

    pgClient.query("insert into values(number) values($1)", [index])

    res.send({working: true})
})


app.listen(5000, err => {
    console.log("Listening to port 5000")
})