// Dependencies
const dgram = require("dgram")

// Local
const Log = require("../log")

// Global
let udpServers = new Map()

/**
 * UDP probe instance
 * @param id            - Id of probe in config file
 * @param endpoint      - Object of endpoint, endpoint settings for probe, contains fields of "type", "addr", "port"
 * @param data          - Object of data, data that needs to be sent to remote server, contains fields of "type", "content"
 * @param expect        - Object of expect, expected data that will be responded from remote server
 * @param interval      - Time interval for data that needs to be sent to remote server, default is 3000(ms)
 * @param option        - Object of option settings
 */
module.exports = (group, id, endpoint, data, expect, interval, options = undefined, updateStatus) => {
    Log.info(`[${group} - ${id}] UDP prober initializing...`)

    let server = undefined
    switch (endpoint.type) {
        case "ipv4":
            server = dgram.createSocket('udp4')
            Log.info(`[${group} - ${id}] Endpoint: ${endpoint.addr}:${endpoint.port}`)
            break
        case "ipv6":
            server = dgram.createSocket('udp6')
            Log.info(`[${group} - ${id}] Endpoint: ${endpoint.addr}:${endpoint.port}`)
            break
        default:
            return new Error(`[${group} - ${id}] Endpoint type ${endpoint.type} is not implemented in udp prober`)
    }

    let buffer = undefined
    switch (data.type) {
        case "json":
            buffer = JSON.stringify(data.content)
            break
        case "raw":
            buffer = data.content
            break
        default:
            return new Error(`Unknown \`data.type\` ${data.type} encountered in udp prober`)
    }

    server.on('message', (msg, rinfo) => {
        if (rinfo.address == endpoint.addr) {
            switch (expect.type) {
                case "json":
                    try {
                        let parsed = JSON.parse(msg)
                        if (JSON.stringify(parsed) == JSON.stringify(expect.content)) {
                            updateStatus(group, id, true)
                        }
                        else {
                            Log.info(`[${id}] Unexpected response: ${msg.toString()}`)
                            updateStatus(group, id, false)
                        }
                    } 
                    catch (err) {
                        return new Error(`Unexpected error occured: ${err.stack}`)
                    }
                    break
                case "raw":
                    if (msg === Buffer.from(expect.content)) {
                        updateStatus(group, id, true)
                    }
                    else {
                        updateStatus(group, id, false)
                        Log.info(`[${id}] Unexpected response: ${msg.toString()}`)
                    }
                    break
                default:
                    Log.warning(`Unknown \`expect.type\` ${expect.type} encountered in udp prober`)
                    return new Error(`Unknown \`expect.type\` ${expect.type} encountered in udp prober`)
            }
        } else {
            Log.warning(`Unknown responder from ${rinfo.addr}:${rinfo.port}`)
        }
    })

    server.on('error', (err) => {
        Log.fatal(`[${id}] Server error:\n${err.stack}`)
        server.close()
    })

    udpServers.set(id, server)

    return setInterval(() => {
        let server = udpServers.get(id)
        server.send(buffer, endpoint.port, endpoint.addr, err => {
            if (err) {
                Log.fatal(err)
            }
        })
    }, interval)
}
