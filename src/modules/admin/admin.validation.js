import Joi from "joi";

const coordinate = (min, max) => Joi.number().min(min).max(max).required();

const stopSchema = Joi.object({
  stopName: Joi.string().trim().min(2).max(100).required(),
  stopCode: Joi.string().trim().max(30).allow("", null),
  stopOrder: Joi.number().integer().min(1).required(),
  lat: coordinate(-90, 90),
  lng: coordinate(-180, 180),
  arrivalTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .allow("", null),
  departureTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .allow("", null),
  distanceFromPrevKm: Joi.number().min(0).allow(null),
});

const createTransitScheduleSchema = Joi.object({
  transitType: Joi.string().valid("bus", "train").required(),
  routeName: Joi.string().trim().min(2).max(120).required(),
  routeNumber: Joi.string().trim().min(1).max(30).required(),
  origin: Joi.string().trim().min(2).max(100).required(),
  destination: Joi.string().trim().min(2).max(100).required(),
  baseFare: Joi.number().min(0).required(),
  travelDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  vehicleNumber: Joi.string().trim().min(1).max(40).required(),
  departureTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required(),
  arrivalTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .allow("", null),
  driverName: Joi.string().trim().max(100).allow("", null),
  driverPhone: Joi.string().trim().max(30).allow("", null),
  totalSeats: Joi.number().integer().min(1).max(10000).required(),
  stops: Joi.array().items(stopSchema).min(2).max(100).required(),
});

export default { createTransitScheduleSchema };
