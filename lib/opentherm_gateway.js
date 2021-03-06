const config = require('../config/config.json')
const constants = require('./constants.js')
const convert = require('./convert.js')

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialPort = new SerialPort(config.otgw.device, { baudRate: config.otgw.baudrate })
const parser = serialPort.pipe(new Readline({ delimiter: '\r\n' }))
const EventEmitter = require('events').EventEmitter

module.exports = new EventEmitter()

let previousValues = []
let values = []

const isSupportedMessage = function(target, type) {
    return (target == 'B' || target == 'T' || target == 'A')
        && (type == '1' || type == '4' || type == 'C' || type == '9' )
}

const setValue = (id, value) => {
    console.log(`Send to OpenTherm Gateway => ${id} = ${value}`)
    serialPort.write( `${id}=${value}\r\n`)
}

parser.on('data', data => {
    // check for OT packets
    const target = data.slice( 0, 1 ); // B, T, A, R, E
    const type = data.slice( 1, 2 ); //
    const id = parseInt( data.slice( 3, 5 ), 16 ); //
    const payload = data.slice( -4 ); // last 4 chars

    if (data.indexOf(':') > -1 || data.length != 9) {
        return
    }

    if ( isSupportedMessage(target, type) && id in constants.OPENTHERM_IDS ) {
        const openthermId = constants.OPENTHERM_IDS[id]
        const name = openthermId.name

        switch ( openthermId.type ) {
            case 'flag8':
                if ( target !== 'A' ) {
                    values[name] = convert.hex2dec( payload );

                    if ( ( values[name] & ( 1 << 1 ) ) > 0 ) {
                        values['flame_status_ch'] = 1;
                    } else {
                        values['flame_status_ch'] = 0;
                    }

                    if ( ( values[name] & ( 1 << 2 ) ) > 0 ) {
                        values['flame_status_dhw'] = 1;
                    } else {
                        values['flame_status_dhw'] = 0;
                    }

                    if ( ( values[name] & ( 1 << 3 ) ) > 0 ) {
                        values['flame_status_bit'] = 1;
                    } else {
                        values['flame_status_bit'] = 0;
                    }
                }
                break;

            case 'f8.8':
                values[name] = ( parseInt( payload, 16 ) / 256 ).toFixed( 2 );
                break;

            case 'u16':
                values[name] = parseInt( payload, 16 );
                break;

            default:
                console.warn(`Unsupported OpenTherm data type ${openthermId.type}`)
        }

        // check for changes
        for ( let field in values ) {
            const value = values[field]
            if ( value !== previousValues[field] ) {
                console.log(`Received from OpenTherm Gateway => ${field} = '${value}'`)
                module.exports.emit('message', { field, value})
                previousValues[field] = value;
            }
        }
    }
})

module.exports.setRemoteSetpointOverride = temperature => {
    setValue('TT', temperature)
}

module.exports.setRoomSetpoint = temperature => {
    setValue('TC', temperature)
}

module.exports.setDomesticHotWaterEnabled = enabled => {
    const value = enabled ? 1 : 0
    setValue('HW', value)
}

module.exports.setOutsideTemperature = temperature => {
    setValue('OT', temperature)
}

module.exports.rawCommand = (command) => {
    if (command) {
        console.log(`Send raw command to OpenTherm Gateway => ${command}`)
        serialPort.write( `${command}\r\n`)
    } else {
        console.error(`Invalid command: ${command}`)
        return
    }
}
