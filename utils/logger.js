require("dotenv").config();
const { createLogger, format, transports } = require("winston");
const path = require('path');

let loggerTransports = [];

if (process.env.NODE_ENV !== "local") {
  const httpTransportOptions = {
    host: "http-intake.logs.us5.datadoghq.com",
    path: `/api/v2/logs?dd-api-key=${process.env.DD_API_KEY}&ddsource=nodejs&service=${process.env.DD_SERVICE}`,
    ssl: true,
  };

  loggerTransports.push(new transports.Http(httpTransportOptions));
} else {
  loggerTransports.push(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );
}

const fileInfoFormat = format((info) => {
  if (info.error instanceof Error) {
    const stack = info.error.stack.split('\n');
    // Usually, the first line of the stack trace is the error message,
    // and the second line is the actual error location
    const caller = stack[1];
    const match = caller.match(/at (.+) \(?(.+):(\d+):(\d+)\)?/);
    if (match) {
      info.filename = path.basename(match[2]);
      info.line = match[3];
    }
  }
  return info;
});


const logger = createLogger({
  level: 'info',
  exitOnError: false,
  format: format.combine(
    fileInfoFormat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: loggerTransports,
});

module.exports = logger;
