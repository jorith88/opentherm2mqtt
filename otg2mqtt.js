/*
* Description: Connect OpenTherm gateway to MQTT
* Author: https://github.com/githubcdr/
* Project: http://otgw.tclcode.com/
* Thanks to hekkers.net
*/

const config = require('./config.json')

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const serialPort = new SerialPort(config.otgw.device, { baudRate: config.otgw.baudrate })

const mqtt = require( 'mqtt' )
const convert = require('./convert.js')

const opentherm_ids = {
		0: "flame_status",
		1: "control_setpoint",
		9: "remote_override_setpoint",
		14: "max_relative_modulation_level",
		16: "room_setpoint",
		17: "relative_modulation_level",
		18: "ch_water_pressure",
		24: "room_temperature",
		25: "boiler_water_temperature",
		26: "dhw_temperature",
		27: "outside_temperature",
		28: "return_water_temperature",
		56: "dhw_setpoint",
		57: "max_ch_water_setpoint",
		116: "burner_starts",
		117: "ch_pump_starts",
		118: "dhw_pump_starts",
		119: "dhw_burner_starts",
		120: "burner_operation_hours",
		121: "ch_pump_operation_hours",
		122: "dhw_pump_valve_operation_hours",
		123: "dhw_burner_operation_hours"
	}

const opentherm_ids_types = {
		0: "flag8",
		1: "f8.8",
		9: "f8.8",
		14: "f8.8",
		16: "f8.8",
		17: "f8.8",
		18: "f8.8",
		24: "f8.8",
		25: "f8.8",
		26: "f8.8",
		27: "f8.8",
		28: "f8.8",
		56: "f8.8",
		57: "f8.8",
		116: "u16",
		117: "u16",
		118: "u16",
		119: "u16",
		120: "u16",
		121: "u16",
		122: "u16",
		123: "u16"
	}

let previous = []
let topics = []

const parser = serialPort.pipe(new Readline({ delimiter: '\r\n' }))

//serialPort.on( 'open', function () {
// console.log( 'Serial port open' );
//} );

client = mqtt.connect( config.mqtt.url, {
	will: {
		topic: config.mqtt.topic.status,
		payload: 'offline',
		retain: true,
		qos: 1
	},
	username: config.mqtt.username,
	password: config.mqtt.password
} );
client.publish( config.mqtt.topic.log, 'service started' );
client.publish( config.mqtt.topic.status, 'online', {
	retain: true,
	qos: 1
} );
client.subscribe( config.mqtt.topic.control.subscribe );

client.on( 'message', function ( topic, message ) {
	switch ( topic ) {
	case config.mqtt.topic.control.status:
		result = 'online';
		break;

	case config.mqtt.topic.control.temp_temporary:
		serialPort.write( 'TT=' + message + '\r\n' );
		result = message;
		break;

	case config.mqtt.topic.control.temp_constant:
		serialPort.write( 'TC=' + message + '\r\n' );
		result = message;
		break;

	case config.mqtt.topic.control.hot_water:
		result = message;
		serialPort.write( 'HW=' + message + '\r\n' );
		break;

	case config.mqtt.topic.control.temp_outside:
		result = message;
		serialPort.write( 'OT=' + message + '\r\n' );
		break;
	}

	client.publish( `${config.mqtt.topic.log}/${topic}`, result );
} );

parser.on( 'data', function ( data ) {
	// check for OT packets
	opentherm_target = data.slice( 0, 1 ); // B, T, A, R, E
	opentherm_type = data.slice( 1, 2 ); //
	opentherm_id = parseInt( data.slice( 3, 5 ), 16 ); //
	opentherm_payload = data.slice( -4 ); // last 4 chars

	//	console.log( data );

	if ( data.length == 9 ) {
		//if (opentherm_target == "B" || opentherm_target == "T" || opentherm_target == "A" || opentherm_target == "R" || opentherm_target == "E") {
		if ( opentherm_target == "B" || opentherm_target == "T" || opentherm_target == "A" ) {
			if ( opentherm_type == "1" || opentherm_type == "4" || opentherm_type == "C" || opentherm_type == "9" ) {
				// if (opentherm_type == "1" || opentherm_type == "4" ) {
				if ( opentherm_id in opentherm_ids ) {
					topic = `${config.mqtt.topic.values}/${opentherm_ids[ opentherm_id ]}`;
					switch ( opentherm_ids_types[ opentherm_id ] ) {
					case 'flag8':
						if ( opentherm_target != "A" ) {
							topics[ topic ] = convert.hex2dec( opentherm_payload );

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
						topics[ topic ] = ( parseInt( opentherm_payload, 16 ) / 256 ).toFixed( 2 );
						break;

					case 'u16':
						topics[ topic ] = parseInt( opentherm_payload, 16 );
						break;
					}

					// check for changes that need to be published
					for ( var value in topics ) {
						if ( topics[ value ] != previous[ value ] ) {
							client.publish( value, String( topics[ value ] ), {
								retain: true
							} );
							previous[ value ] = topics[ value ];
						}
					}
				}
			}
		}
	}
} );
