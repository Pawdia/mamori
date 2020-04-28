// Dependencies
const glob = require("glob")
const path = require("path")
const fs = require('fs')

// Local
const Log = require("./log")
const udpProbe = require("./prober/udp")
const httpProbe = require("./prober/http")

let configs = new Map()
let intervals = new Map()
let prober = new Map()
let groupStatus = new Map()
prober.set("udp", udpProbe)
prober.set("http", httpProbe)

let mamori = {
    loadConfig(confd) {
        let files = glob.sync(path.join(confd, "/*.json"))
        for (let i = 0; i < files.length; i++) {
            let configFile = files[i]
            let config = undefined
            try {
                let configBuffer = fs.readFileSync(configFile)
                let groupId = path.basename(configFile)
                groupId = groupId.substr(0, groupId.length - 5)
                
                let subIds = new Map()
                config = JSON.parse(configBuffer)
                if (Array.isArray(config)) {
                    config.forEach(subConfig => {
                        subConfig.group = groupId
                        subIds.set(subConfig.id, true)
                        configs.set(subConfig.id, subConfig)
                    })
                }
                else {
                    config.group = groupId
                    subIds.set(config.id, true)
                    configs.set(config.group + config.id, config)
                }

                groupStatus.set(groupId, subIds)
            } catch (err) {
                console.log(err)
                continue
            }
        }
    },

    start(defaultInterval) {
        for (let id of configs.keys()) {
            let service = configs.get(id)
            if (service.probe !== undefined) {
                let probe = service.probe
                let probeInstance = prober.get(probe.type)
                let interval = undefined
                switch (probe.type) {
                    case "udp":
                        interval = probeInstance(
                            service.group,
                            service.id, 
                            probe.endpoint, 
                            probe.data, 
                            probe.expect, 
                            probe.interval === undefined ? defaultInterval : probe.interval,
                            probe.option,
                            this.updateStatus
                        )
                        break
                    case "tcp":
                        break
                    case "http":
                        interval = probeInstance(
                            service.group,
                            service.id,
                            probe.endpoint,
                            probe.method,
                            probe.param,
                            probe.interval === undefined ? defaultInterval : probe.interval,
                            probe.option,
                            this.updateStatus
                        )
                        break
                    default:
                        break
                }

                // Error Handling
                if (interval instanceof Error) {
                    Log.fatal(interval)
                    throw interval
                }
                
                intervals.set(id, interval)
            }
        }
    },

    updateStatus(group, id, status) {
        // TODO
        Log.info(`[${group} - ${id}] ${status ? "OK" : "Error"}`)
    }
}

module.exports = mamori
