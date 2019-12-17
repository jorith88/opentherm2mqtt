const config = require('../config/config.json')

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialPort = new SerialPort(config.otgw.device, { baudRate: config.otgw.baudrate })
const parser = serialPort.pipe(new Readline({ delimiter: '\r\n' }))
const EventEmitter = require('events').EventEmitter

module.exports = new EventEmitter()

parser.on( 'data', data => module.exports.emit('data', data))

module.exports.write = data => serialPort.write( `${data}\r\n`)