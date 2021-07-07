const mongoose = require('mongoose')
const Schema = mongoose.Schema
const messSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    content: {
        type: String,
    },
    room: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Mess', messSchema)