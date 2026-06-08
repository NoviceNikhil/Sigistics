const Joi = require("joi");
const xlsx = require("xlsx");
const AppError = require("../utils/AppError");

// ==========================================
// 1. SCHEMAS
// ==========================================

const agentIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Agent ID must be a valid number.",
    "any.required": "Agent ID is required.",
  }),
});

const manualAssignmentSchema = Joi.object({
  agent_id: Joi.number().integer().positive().required().messages({
    "number.base": "Agent ID must be a valid number.",
    "any.required":
      "You must provide an agentId to assign them to this shipment.",
  }),
});

const availabilityToggleSchema = Joi.object({
  // Adjust these fields based on what your frontend sends for a toggle
  availability_status: Joi.string()
    .valid("available", "offline", "busy")
    .optional(),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "You must provide at least one status field to toggle.",
  });

const createAgentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone must be a valid number string (10-15 digits).",
    }),
  city: Joi.string().min(2).required(),
  subregion: Joi.string().min(2).required(),
});

const updateAgentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional(),
  city: Joi.string().min(2).optional(),
  subregion: Joi.string().min(2).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  availability_status: Joi.string()
    .valid("available", "offline", "busy")
    .optional(),
  is_active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update.",
  });

const excelAgentRowSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  city: Joi.string().required(),
  subregion: Joi.string().required(),
}).unknown(true);

const excelAgentArraySchema = Joi.array()
  .items(excelAgentRowSchema)
  .min(1)
  .messages({
    "array.min": "The uploaded Agent Excel file is empty.",
  });

// ==========================================
// 2. MIDDLEWARES
// ==========================================

exports.validateAgentId = (req, res, next) => {
  const { error } = agentIdSchema.validate(req.params, { abortEarly: false });
  if (error)
    return next(
      new AppError(
        `Validation Failed: ${error.details.map((d) => d.message).join(" | ")}`,
        400,
      ),
    );
  next();
};
exports.validateAvailabilityToggle = (req, res, next) => {
  const { error } = availabilityToggleSchema.validate(req.body, {
    abortEarly: false,
  });
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

exports.validateCreateAgent = (req, res, next) => {
  const { error } = createAgentSchema.validate(req.body, { abortEarly: false });
  if (error)
    return next(
      new AppError(
        `Validation Failed: ${error.details.map((d) => d.message).join(" | ")}`,
        400,
      ),
    );
  next();
};

exports.validateUpdateAgent = (req, res, next) => {
  const { error } = updateAgentSchema.validate(req.body, { abortEarly: false });
  if (error)
    return next(
      new AppError(
        `Validation Failed: ${error.details.map((d) => d.message).join(" | ")}`,
        400,
      ),
    );
  next();
};
exports.validateManualAssignment = (req, res, next) => {
  const { error } = manualAssignmentSchema.validate(req.body, {
    abortEarly: false,
  });
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
exports.validateAgentExcel = (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return next(
        new AppError("Validation Failed: No Excel file provided.", 400),
      );
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
    );

    const { error } = excelAgentArraySchema.validate(data, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details
        .map((detail) => {
          const rowNum =
            typeof detail.path[0] === "number" ? detail.path[0] + 2 : "Unknown";
          return `Row ${rowNum}: ${detail.message}`;
        })
        .join(" | ");
      return next(
        new AppError(`Agent Excel Validation Failed: ${errorMessages}`, 400),
      );
    }

    // Standardize phone to string for all rows to prevent downstream crashes
    data.forEach((row) => {
      row.phone = row.phone.toString();
    });

    req.parsedAgentExcelData = data;
    next();
  } catch (err) {
    return next(new AppError("Failed to parse Agent Excel file.", 500));
  }
};
