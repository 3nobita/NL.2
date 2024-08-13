const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  categories: [String],
  imageUrl: String,
  name:String,
  by:String,
  location:String,
  price: String,
  status: String,
  configuration: String,
  possession: Date,
  units: Number,
  land: String,
  residence: String,  // Fixed the typo from 'recidence' to 'residence'
  builtup: String,
  blocks: String,
  floor: String,
  noofunits: Number,
  rera: String,
  highlight: String,
  about: String,
  unitytype: String,
  size: String,
  range: String,
  booking: String,
  token: String,
  plans: String,
  amenities: String,  // Fixed the typo from 'Srting' to 'String'
  virtual: String,
});

module.exports = mongoose.model('Property', propertySchema);
