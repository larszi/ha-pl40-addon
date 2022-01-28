#!/usr/bin/with-contenv bashio
set +u

export USERNAME=$(bashio::config 'username')
bashio::log.info "Username configured as ${USERNAME}."

export PASSWORD=$(bashio::config 'password')
bashio::log.info "Password configured as ${PASSWORD}."

bashio::log.info "Starting bridge service."
npm run start