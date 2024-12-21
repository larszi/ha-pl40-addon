#!/usr/bin/with-contenv bashio
set +u

export USERNAME=$(bashio::config 'username')
bashio::log.info "Username configured as ${USERNAME}."

export PASSWORD=$(bashio::config 'password')
bashio::log.info "Password configured as ${PASSWORD}."

export DASHBOARD=$(bashio::config 'dashboard')
bashio::log.info "Dashboard configured as ${DASHBOARD}."

export MQTTUSER=$(bashio::config 'mqttuser')
bashio::log.info "MQTT User configured as ${MQTTUSER}."

export MQTTPW=$(bashio::config 'mqttpw')
bashio::log.info "MQTT PW configured as ${MQTTPW}."

export MQTTURL=$(bashio::config 'mqtturl')
bashio::log.info "MQTT url configured as ${MQTTURL}."

export LOG_LEVEL=$(bashio::config 'log_level')
bashio::log.info "Loglevel conigured as '${LOG_LEVEL}' if emty using default 'info'."

bashio::log.info "Starting bridge service."
npm run start