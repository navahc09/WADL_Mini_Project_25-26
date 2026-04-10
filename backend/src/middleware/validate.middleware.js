function validate(schema, property = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = new Error("Validation failed");
      validationError.statusCode = 400;
      validationError.details = error.details.map((detail) => detail.message);
      return next(validationError);
    }

    req[property] = value;
    return next();
  };
}

module.exports = validate;
