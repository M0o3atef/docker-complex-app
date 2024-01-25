const keys = require("./keys")
const redis = require("redis")

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retryStrategy: () => 1000
})

const fib = function(index){
    if(index < 2) return 1
    return fib(index-1) + fib(index-2)
}

redisSubscriber = redisClient.duplicate()

redisSubscriber.subscribe("insert")

redisSubscriber.on("message", (channel, message) => {
    redisClient.hset("values", message, fib(parseInt(message)))
})