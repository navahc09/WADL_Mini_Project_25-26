const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).required(),
  phone: Joi.string().min(10).required(),
  rollNumber: Joi.string().min(3).required(),
  branch: Joi.string().min(2).required(),
  graduationYear: Joi.alternatives(Joi.number(), Joi.string()).required(),
  cgpa: Joi.number().min(0).max(10).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  loginSchema,
  registerSchema,
  refreshSchema,
};
