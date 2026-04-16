const Joi = require("joi");

// Login accepts either enrollmentNo (student) or email (admin).
// We use a custom validator instead of xor() to avoid edge cases
// where an empty-string field counts as "present" and breaks xor.
const loginSchema = Joi.object({
  enrollmentNo: Joi.string().trim().uppercase().allow("", null),
  email: Joi.string().email().allow("", null),
  password: Joi.string().min(6).required(),
}).custom((value, helpers) => {
  const hasEnrollment = Boolean(value.enrollmentNo);
  const hasEmail = Boolean(value.email);

  if (!hasEnrollment && !hasEmail) {
    return helpers.error("any.invalid");
  }

  // Strip whichever field is empty so the controller doesn't see it
  if (!hasEnrollment) delete value.enrollmentNo;
  if (!hasEmail) delete value.email;

  return value;
}, "login identifier check").messages({
  "any.invalid": "Provide an enrollment number (student) or email (admin)",
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const setupPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

module.exports = {
  loginSchema,
  refreshSchema,
  setupPasswordSchema,
  resetPasswordSchema,
};
