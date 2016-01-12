var mongoose = require('mongoose');


var ShowSchema = mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  season: {
    type: Number
  },
  episodes: {
    type:[]
  }

});

module.exports = mongoose.model('shows', ShowSchema);