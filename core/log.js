// Dependencies
const log4js = require("log4js")

let SysTime = new Date()
let logTime = SysTime.getFullYear() + "-" + ("0" + (SysTime.getMonth() + 1)).slice(-2) + "-" + ("0" + SysTime.getDate()).slice(-2)
const coreLogFileName = `../logs/Mamori-${logTime}.log`

log4js.configure({
    appenders: {
        Core: { type: "file", filename: coreLogFileName },
        console: { type: "console" }
    },
    categories: {
        Mamori: { appenders: ["console", "Core"], level: "trace" },
        default: { appenders: ["console"], level: "trace" }
    }
})

let MamoriLogger = log4js.getLogger("Mamori")

function info(log) {
    MamoriLogger.info(log)
}

function trace(log) {
    MamoriLogger.trace(log)
}

function debug(log) {
    MamoriLogger.debug(log)
}

function warning(log) {
    MamoriLogger.warn(log)
}

function fatal(log) {
    MamoriLogger.fatal(log)
}

function level(lev) {
    MamoriLogger.level = lev
}

module.exports = {
    info,
    trace,
    debug,
    warning,
    fatal,
    level
}