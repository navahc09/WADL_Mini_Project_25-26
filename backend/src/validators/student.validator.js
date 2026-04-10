const Joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2),
  email: Joi.string().email(),
  phone: Joi.string().min(10),
  city: Joi.string().min(2),
  branch: Joi.string().min(2),
  graduationYear: Joi.alternatives(Joi.number(), Joi.string()),
  cgpa: Joi.number().min(0).max(10),
  rollNumber: Joi.string().min(3),
  headline: Joi.string().min(2),
  about: Joi.string().min(10),
  preferences: Joi.object({
    locations: Joi.array().items(Joi.string()),
    domains: Joi.array().items(Joi.string()),
    expectedSalary: Joi.string(),
  }),
});

module.exports = {
  updateProfileSchema,
};
