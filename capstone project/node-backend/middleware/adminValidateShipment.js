const Joi = require("joi");
const xlsx = require("xlsx");
const AppError = require("../utils/AppError");

// ==========================================
// 1. SCHEMAS
// ==========================================

const shipmentIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Shipment ID must be a valid UUID format.",
    "any.required": "Shipment ID is required."
  })
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("created", "assigned", "picked", "in_transit", "delivered", "cancelled")
    .required()
    .messages({
      "any.only": "Status must be one of: created, assigned, picked, in_transit, delivered, cancelled.",
      "any.required": "Status is required."
    }),
  is_delayed: Joi.boolean().optional().messages({
    "boolean.base": "is_delayed must be a boolean."
  }),
  delay_reason: Joi.string().when("is_delayed", {
    is: true,
    then: Joi.string().min(3).required().messages({
      "any.required": "delay_reason is required when is_delayed is true.",
      "string.min": "delay_reason must be at least 3 characters long."
    }),
    otherwise: Joi.string().allow("", null).optional()
  }),
  notes: Joi.string().allow("", null).optional()
});

const updateDetailsSchema = Joi.object({
  pickup_city: Joi.string().min(2).max(100).optional(),
  pickup_subregion: Joi.string().min(2).max(100).optional(),
  delivery_city: Joi.string().min(2).max(100).optional(),
  delivery_subregion: Joi.string().min(2).max(100).optional(),
  package_type: Joi.string().valid("small", "medium", "large").optional().messages({
    "any.only": "package_type must be small, medium, or large."
  }),
  weight_kg: Joi.number().positive().optional().messages({
    "number.positive": "weight_kg must be a positive number.",
    "number.base": "weight_kg must be a number."
  }),
  agent_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": "agent_id must be a positive integer or null."
  })
}).min(1).messages({
  "object.min": "You must provide at least one field to update."
});

const shipmentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().optional(),
  fields: Joi.string().optional(),
  search: Joi.string().allow("").optional()
}).unknown(true); // Allow other filter fields to pass through (like status, user_id, etc.)

const excelRowSchema = Joi.object({
  customer_email: Joi.string().email().required().messages({
    "string.email": "customer_email must be a valid email.",
    "any.required": "customer_email is required."
  }),
  pickup_city: Joi.string().min(2).required(),
  pickup_subregion: Joi.string().min(2).required(),
  delivery_city: Joi.string().min(2).required(),
  delivery_subregion: Joi.string().min(2).required(),
  package_type: Joi.string().required(),
  weight_kg: Joi.number().positive().required().messages({
    "number.positive": "weight_kg must be a valid positive number."
  })
}).unknown(true); // Allow columns like agent_phone to exist

const excelArraySchema = Joi.array().items(excelRowSchema).min(1).messages({
  "array.min": "The uploaded Excel file is empty."
});

// ==========================================
// 2. MIDDLEWARE FUNCTIONS
// ==========================================

exports.validateShipmentIdParam = (req, res, next) => {
  const { error } = shipmentIdSchema.validate(req.params, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(" | ");
    return next(new AppError(`Validation Failed: ${errorMessages}`, 400));
  }
  next();
};

exports.validateUpdateStatus = (req, res, next) => {
  const { error } = updateStatusSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(" | ");
    return next(new AppError(`Validation Failed: ${errorMessages}`, 400));
  }
  next();
};

exports.validateUpdateDetails = (req, res, next) => {
  const { error } = updateDetailsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(" | ");
    return next(new AppError(`Validation Failed: ${errorMessages}`, 400));
  }
  next();
};

exports.validateShipmentQuery = (req, res, next) => {
  const { error } = shipmentQuerySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(" | ");
    return next(new AppError(`Validation Failed: ${errorMessages}`, 400));
  }
  next();
};

exports.validateShipmentExcel = (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return next(new AppError("Validation Failed: No Excel file provided.", 400));
    }

    // 1. Parse the Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    // 2. Validate the entire array using Joi
    const { error } = excelArraySchema.validate(data, { abortEarly: false });
    
    if (error) {
      // Format the array errors to be readable (e.g., "[0].weight_kg must be a positive number")
      const errorMessages = error.details.map((detail) => {
        // detail.path[0] will be the array index, let's make it 1-based row number for the user
        const rowNum = typeof detail.path[0] === "number" ? detail.path[0] + 2 : "Unknown";
        return `Row ${rowNum}: ${detail.message}`;
      }).join(" | ");

      return next(new AppError(`Excel Validation Failed: ${errorMessages}`, 400));
    }

    // 3. Clean up the data format before passing to service
    data.forEach(row => {
      // Normalize strings: trim and handle potentially missing fields
      const stringFields = ["customer_email", "pickup_city", "delivery_city", "pickup_subregion", "delivery_subregion", "package_type"];
      stringFields.forEach(field => {
        if (typeof row[field] === "string") {
          row[field] = row[field].trim();
        }
      });

      // Normalize Case for comparisons
      if (row.package_type) row.package_type = row.package_type.toLowerCase();
      
      // Normalize weight as a numeric decimal
      if (row.weight_kg !== undefined) {
        row.weight_kg = Number(parseFloat(row.weight_kg).toFixed(2));
      }
    });

    req.parsedExcelData = data;
    next();
  } catch (err) {
    return next(new AppError("Failed to parse Excel file. Ensure it is a valid .xlsx format.", 500));
  }
};