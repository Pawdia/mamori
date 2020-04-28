let mamori = require("./Core/mamori")
let mamoriConfig = require("./config.json")

let main = () => {
    mamori.loadConfig("./conf.d")
    mamori.start(mamoriConfig.interval)
}

main()
