const { Location } = require("../models/index.sql");
const APIFeatures = require("../utils/APIfeatures");
exports.createLocation = async (data) => {
  const existing = await Location.findOne({
    where: { city: data.city, subregion: data.subregion },
    paranoid: false 
  });

  if (existing) {
    if (existing.deletedAt) {
      await existing.restore();
      return existing;
    }
    throw new Error("LOCATION_ALREADY_EXISTS");
  }

  return await Location.create(data);
};

exports.getAllLocations = async (query) => {
  const features = new APIFeatures(Location, query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .search(); 

  const { results, data: locations } = await features.execute();
  return { results, locations };
};

exports.getLocationById = async (id) => {
  const location = await Location.findByPk(id);
  if (!location) throw new Error("LOCATION_NOT_FOUND");
  return location;
};

exports.deleteLocation = async (id) => {
  const location = await Location.findByPk(id);
  if (!location) throw new Error("LOCATION_NOT_FOUND");

  // This performs a soft delete assuming your Location model has paranoid: true
  await location.destroy();
  return true;
};
exports.restoreLocation = async (id) => {
  const location = await Location.findByPk(id, { paranoid: false });
  if (!location) throw new Error("LOCATION_NOT_FOUND");
  
  if (!location.deletedAt) {
    throw new Error("LOCATION_NOT_DELETED");
  }

  await location.restore();
  return location;
};