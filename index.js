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
    const topic = `${config.mqtt.topic.values}/${field}`
    mqtt.publish( topic, value, { retain: true, qos: 1 })
})

mqtt.on( 'message', function ( { topic, value } ) {
    switch ( topic ) {
        case config.mqtt.topic.control.temp_temporary:
            openthermGateway.setRemoteSetpointOverride(value)
            break;

        case config.mqtt.topic.control.temp_constant:
            openthermGateway.setRoomSetpoint(value)
            break;

        case config.mqtt.topic.control.hot_water:
            openthermGateway.setDomesticHotWaterEnabled(value === 1)
            break;

        case config.mqtt.topic.control.temp_outside:
            openthermGateway.setOutsideTemperature(value)
            break;

        default:
            console.error(`Topic ${topic} not supported`)
            break;
    }
});
