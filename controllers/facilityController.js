const Facility = require("../models/FacilityModel");
const factory = require("./handlerFactory");

exports.getAllFacilities = factory.getAll(Facility);
exports.getFacility = factory.getOne(Facility);
exports.createFacility = factory.createOne(Facility);
exports.updateFacility = factory.updateOne(Facility);
exports.deleteFacility = factory.deleteOne(Facility);
