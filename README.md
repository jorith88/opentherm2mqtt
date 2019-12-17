# opentherm2mqtt

OpenThermGateway2MQTT

## What

Control (parts of) the world of OpenTherm using mqtt.

## How

- Connect a USB Serial cable to your Raspberry Pi, install Node.js and run this code to allow mqtt publishing of OpenTherm realtime data. It's pub/sub so you can control the OpenTherm Gateway (otg) using mqtt messages.
- Create a configuration file in `config/config.json`. Just copy `config.json.example` and adjust the parameters to your needs.
- Run the application using `npm start` or `docker-compose up`

## Why

I want to create Skynet at home.

## Related projects;

OpenTherm gateway, more info see http://otgw.tclcode.com
Mqtt, more info see http://mqtt.org
