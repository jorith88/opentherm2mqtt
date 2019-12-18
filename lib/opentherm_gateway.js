const config = require('../config/config.json')
const constants = require('./lib/constants.js')

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

        switch ( openthermId.type ) {
            case 'flag8':
                if ( target !== 'A' ) {
                    values[id] = convert.hex2dec( payload );

                    if ( ( values[id] & ( 1 << 1 ) ) > 0 ) {
                        values['flame_status_ch'] = 1;
                    } else {
                        values['flame_status_ch'] = 0;
                    }

                    if ( ( values[id] & ( 1 << 2 ) ) > 0 ) {
                        values['flame_status_dhw'] = 1;
                    } else {
                        values['flame_status_dhw'] = 0;
                    }

                    if ( ( values[id] & ( 1 << 3 ) ) > 0 ) {
                        values['flame_status_bit'] = 1;
                    } else {
                        values['flame_status_bit'] = 0;
                    }
                }
                break;

            case 'f8.8':
                values[id] = ( parseInt( payload, 16 ) / 256 ).toFixed( 2 );
                break;

            case 'u16':
                values[id] = parseInt( payload, 16 );
                break;

            default:
                console.warn(`Unsupported OpenTherm data type ${openthermId.type}`)
        }

        // check for changes
        for ( let id in values ) {
            const value = values[id]
            if ( value !== previousValues[id] ) {
                module.exports.emit('message', { field: id.name, value})
                previousValues[id] = value;
            }
        }
    }
})

module.exports.write = (id, payload) => {
    serialPort.write( `${id}=${payload}\r\n`)
}