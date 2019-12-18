/*
* Description: Connect OpenTherm gateway to MQTT
* Author: https://github.com/githubcdr/
* Project: http://otgw.tclcode.com/
* Thanks to hekkers.net
*/

const config = require('./config/config.json')
const openthermGateway = require('./lib/opentherm_gateway.js')
const mqtt = require('./lib/mqtt.js')
const convert = require('./lib/convert.js')
const constants = require('./lib/constants.js')

let previous = []
let topics = []

const isSupportedMessage = function(target, type) {
	return (target == 'B' || target == 'T' || target == 'A')
		&& (type == '1' || type == '4' || type == 'C' || type == '9' )
}

openthermGateway.on('data', data => {
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
		const topic = `${config.mqtt.topic.values}/${openthermId.name}`

		switch ( openthermId.type ) {
			case 'flag8':
				if ( target !== 'A' ) {
					topics[ topic ] = convert.hex2dec( payload );

					if ( ( topics[ topic ] & ( 1 << 1 ) ) > 0 ) {
						topics[ `${config.mqtt.topic.values}/flame_status_ch` ] = 1;
					} else {
						topics[ `${config.mqtt.topic.values}/flame_status_ch` ] = 0;
					}

					if ( ( topics[ topic ] & ( 1 << 2 ) ) > 0 ) {
						topics[ `${config.mqtt.topic.values}/flame_status_dhw` ] = 1;
					} else {
						topics[ `${config.mqtt.topic.values}/flame_status_dhw` ] = 0;
					}

					if ( ( topics[ topic ] & ( 1 << 3 ) ) > 0 ) {
						topics[ `${config.mqtt.topic.values}/flame_status_bit` ] = 1;
					} else {
						topics[ `${config.mqtt.topic.values}/flame_status_bit` ] = 0;
					}
				}
				break;

			case 'f8.8':
				topics[ topic ] = ( parseInt( payload, 16 ) / 256 ).toFixed( 2 );
				break;

			case 'u16':
				topics[ topic ] = parseInt( payload, 16 );
				break;

			default:
				console.warn(`Unsupported OpenTherm data type ${openthermId.type}`)
		}

		// check for changes that need to be published
		for ( let topic in topics ) {
			const message = topics[topic]
			if ( message !== previous[ topic ] ) {
				console.log(`Received from OpenTherm Gateway => ${openthermId.name} = '${topics[topic]}'`)
				mqtt.publish( topic, String( message ), {
					retain: true,
					qos: 1
				} );
				previous[ topic ] = message;
			}
		}
	}
})

mqtt.on( 'message', function ( { topic, message } ) {
	let result = null

	switch ( topic ) {
		case config.mqtt.topic.control.status:
			result = 'online';
			break;

		case config.mqtt.topic.control.temp_temporary:
			openthermGateway.write('TT', message);
			result = message;
			break;

		case config.mqtt.topic.control.temp_constant:
			openthermGateway.write('TC', message);
			result = message;
			break;

		case config.mqtt.topic.control.hot_water:
			result = message;
			openthermGateway.write('HW', message);
			break;

		case config.mqtt.topic.control.temp_outside:
			result = message;
			openthermGateway.write('OT', message);
			break;
		default:
			console.error(`Topic ${topic} not supported`)
	}

	if (result) {
		mqtt.publish(`${config.mqtt.topic.log}/${topic}`, result );
	}
});
