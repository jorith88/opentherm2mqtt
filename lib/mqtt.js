const mqtt = require('mqtt')
const { EventEmitter } = require('events')
const config = require('../config/config.json')

module.exports = new EventEmitter()

const client = mqtt.connect(config.mqtt.url, {
    will: {
        topic: config.mqtt.topic.status,
        payload: 'offline',
        retain: true,
        qos: 1,
    },
    username: config.mqtt.username,
    password: config.mqtt.password,
})

client.on('connect', () => {
    console.log('Connected to MQTT broker.')

    client.publish(config.mqtt.topic.log, 'service started')

    client.publish(config.mqtt.topic.status, 'online', {
        retain: true,
        qos: 1,
    })

    client.subscribe(`${config.mqtt.topic.control}/#`)
})


client.on('message', (topic, value) => {
    const field = topic.replace(`${config.mqtt.topic.control}/`, '')
    module.exports.emit('message', { field, value: value.toString() })
})

module.exports.publishValue = (field, value) => {
    const topic = `${config.mqtt.topic.values}/${field}`
    client.publish(topic, String(value), { retain: true, qos: 1 })
}

