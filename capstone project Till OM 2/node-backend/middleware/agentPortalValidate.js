const Joi = require("joi");
const AppError = require("../utils/AppError");

const deliveryIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Delivery ID must be a valid UUID.",
    "any.required": "Delivery ID is required.",
  }),
});

const updateStatusSchema = Joi.object({
  new_status: Joi.string()
    .valid("picked", "in_transit", "delivered")
    .required()
    .messages({
      "any.only": "new_status must be picked, in_transit, or delivered.",
      "any.required": "new_status is required.",
    }),
  notes: Joi.string().trim().max(500).allow("", null).optional(),
});

const updateAvailabilitySchema = Joi.object({
  availability_status: Joi.string()
    .valid("available", "busy", "offline")
    .required()
    .messages({
      "any.only":
        "availability_status must be available, busy, or offline.",
      "any.required": "availability_status is required.",
    }),
});

const updateLocationSchema = Joi.object({
  current_city: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "current_city is required.",
  }),
  current_subregion: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "current_subregion is required.",
  }),
});

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  status: Joi.string()
    .valid(
      "assigned",
      "picked",
      "in_transit",
      "delivered",
      "cancelled",
      "created",
    )
    .optional(),
  search: Joi.string().trim().max(100).allow("").optional(),
  sort: Joi.string()
    .valid(
      "createdAt",
      "-createdAt",
      "expected_delivery_at",
      "-expected_delivery_at",
      "status",
      "-status",
    )
    .optional(),
});

const validate = (schema, source) => (req, res, next) => {
  const { error } = schema.validate(req[source], { abortEarly: false });

  if (error) {
    return next(
      new AppError(
        `Validation Failed: ${error.details.map((d) => d.message).join(" | ")}`,
        400,
      ),
    );
  }

  next();
};

module.exports = {
  validateDeliveryId: validate(deliveryIdSchema, "params"),
  validateAgentDeliveryStatus: validate(updateStatusSchema, "body"),
  validateAgentAvailability: validate(updateAvailabilitySchema, "body"),
  validateAgentDeliveryLocation: validate(updateLocationSchema, "body"),
  validateAgentDeliveryQuery: validate(querySchema, "query"),
};
