const mqtt = require( 'mqtt' )
const config = require('../config/config.json')
const EventEmitter = require('events').EventEmitter

module.exports = new EventEmitter()

const client = mqtt.connect( config.mqtt.url, {
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

client.on( 'message', (topic, message) => module.exports.emit('message', { topic, message }))

module.exports.publish = (topic, message) => client.publish(topic, message )