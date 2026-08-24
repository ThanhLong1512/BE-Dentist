const AppError = require("../utils/appError");

/**
 * Express middleware factory: validate req.body / req.query / req.params with Joi schemas.
 * On success, replaces the corresponding req properties with Joi's coerced/stripped values.
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    try {
      const targets = ["body", "query", "params"];

      for (const key of targets) {
        const schema = schemas[key];
        if (!schema) continue;

        const { error, value } = schema.validate(req[key], {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });

        if (error) {
          const message = error.details.map(d => d.message).join("; ");
          return next(new AppError(message, 400));
        }

        req[key] = value;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = validate;
