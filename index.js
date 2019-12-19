/*
* Description: Connect OpenTherm gateway to MQTT
* Author: https://github.com/githubcdr/, https://github.com/jorith88/
* Project: http://otgw.tclcode.com/
* Thanks to hekkers.net
*/

const config = require('./config/config.json')
const openthermGateway = require('./lib/opentherm_gateway.js')
const mqtt = require('./lib/mqtt.js')

/**
 * OpenTherm -> MQTT
 */
openthermGateway.on('message', ({ field, value }) => {
    mqtt.publishValue(field, value)
})

/**
 * MQTT -> OpenTherm
 */
mqtt.on( 'message', function ( { field, value } ) {
    switch ( field ) {
        case config.control_fields.temp_temporary:
            openthermGateway.setRemoteSetpointOverride(value)
            break;

        case config.control_fields.temp_constant:
            openthermGateway.setRoomSetpoint(value)
            break;

        case config.control_fields.hot_water:
            const enabled = value === '1'
            openthermGateway.setDomesticHotWaterEnabled(enabled)
            break;

        case config.control_fields.temp_outside:
            openthermGateway.setOutsideTemperature(value)
            break;

        default:
            console.error(`Control field '${field}' not supported`)
            break;
    }
});
