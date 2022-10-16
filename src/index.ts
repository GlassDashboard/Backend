// Initialize .env file and load everything in process.env
require('dotenv').config()

// Announce startup for logging
console.log('Glass Backend is now starting up')

import * as mongo from './data/mongo'
import * as express from './express'
import * as socket from './socket'

(async () => {
    // Connect to mongo database
    await mongo.connect()

    // Start express server
    express.start()

    // Start socket.io server
    socket.start()

    console.log(`Ready to rock and roll!`)
})()