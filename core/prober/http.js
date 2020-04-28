// Dependencies
const axios = require("axios")

// Local
const Log = require("../log")

let HTTPProbe = {
    _call(url, func, option) {
        return new Promise((resolve, reject) => {
            func(url, option).then(res => {
                resolve(res.status)
            }).catch(err => {
                reject(false)
            })
        })
    },
    get(url, option) {
        return this._call(url, axios.get, option)
    },
    post(url, option) {
        return this._call(url, axios.post, option)
    }
}

/**
 * HTTP probe instance
 * @param id            - Id of probe in config file 
 * @param endpoint      - 
 * @param interval      - 
 */
module.exports = (group, id, endpoint, method, param = undefined, interval, option = undefined, updateStatus) => {
    Log.info(`[${id}] HTTP prober initializing...`)

    // Uri fill in
    let url = endpoint.addr
    if (!(endpoint.port === undefined || endpoint.port === "")) {
        url = url + ":" + endpoint.port
    }
    Log.info(`[${id}] Checking probe to ${url}`)

    // Data fill in
    let optionObj = { params: undefined, headers: undefined }
    if (param != undefined) optionObj.params = param
    if (option != undefined) optionObj.headers = option

    switch(method) {
        case "get":
            return setInterval(() => {
                HTTPProbe.get(url, option).then(res => {
                    updateStatus(group, id, true)
                }).catch(err => {
                    updateStatus(group, id, false)
                })
            }, interval)
        case "post":
            return setInterval(() => {
                HTTPProbe.post(url, option).then(res => {
                    updateStatus(group, id, true)
                }).catch(err => {
                    updateStatus(group, id, false)
                })
            }, interval)
    }
}
