/*
* Description: Connect OpenTherm gateway to MQTT
* Author: https://github.com/githubcdr/, https://github.com/jorith88/
* Project: http://otgw.tclcode.com/
* Thanks to hekkers.net
*/

const config = require('./config/config.json')
const openthermGateway = require('./lib/opentherm_gateway.js')
const mqtt = require('./lib/mqtt.js')

openthermGateway.on('message', ({ field, value }) => {
    console.log(`Received from OpenTherm Gateway => ${field} = '${value}'`)
    const topic = `${config.mqtt.topic.values}/${field}`
    mqtt.publish( topic, value, { retain: true, qos: 1 })
})

mqtt.on( 'message', function ( { topic, value } ) {
    let result = null
    let id = null

    switch ( topic ) {
        case config.mqtt.topic.control.temp_temporary:
            id = 'TT'
            break;
        case config.mqtt.topic.control.temp_constant:
            id = 'TC'
            break;
        case config.mqtt.topic.control.hot_water:
            id = 'HW'
            break;
        case config.mqtt.topic.control.temp_outside:
            id = 'OT'
            break;
        default:
            console.error(`Topic ${topic} not supported`)
            break;
    }

    if (id && value) {
        console.log(`Write to OpenTherm Gateway => ${id} = ${value}`)
        openthermGateway.write(id, value);
        mqtt.publish(`${config.mqtt.topic.log}/${topic}`, value);
    }
});
