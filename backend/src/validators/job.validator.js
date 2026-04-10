const Joi = require("joi");

const createJobSchema = Joi.object({
  company: Joi.string().min(2).required(),
  title: Joi.string().min(2).required(),
  type: Joi.string().required(),
  mode: Joi.string().required(),
  location: Joi.string().required(),
  salaryLabel: Joi.string(),
  jobPackage: Joi.string(),
  minCgpa: Joi.number().min(0).max(10).required(),
  maxActiveBacklogs: Joi.number().integer().min(0).default(0),
  branches: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string().min(2),
  ).required(),
  tags: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string().min(2),
  ),
  skills: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string().min(2),
  ),
  deadline: Joi.string().required(),
  description: Joi.string().min(20).required(),
  aboutCompany: Joi.string().min(20),
  responsibilities: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(20),
  ).required(),
  requirements: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(10),
  ),
  perks: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(4),
  ),
  process: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(4),
  ),
}).or("salaryLabel", "jobPackage");

const createApplicationSchema = Joi.object({
  jobId: Joi.string().required(),
  documentId: Joi.string().optional(),
});

const uploadDocumentSchema = Joi.object({
  docType: Joi.string().optional(),
  primary: Joi.boolean().optional(),
});

const updateApplicantStatusSchema = Joi.object({
  status: Joi.string().valid("Under Review", "Shortlisted", "Rejected", "Offered").required(),
});

const updateJobSchema = Joi.object({
  company: Joi.string().min(2),
  title: Joi.string().min(2),
  type: Joi.string(),
  mode: Joi.string(),
  location: Joi.string(),
  salaryLabel: Joi.string(),
  jobPackage: Joi.string(),
  minCgpa: Joi.number().min(0).max(10),
  maxActiveBacklogs: Joi.number().integer().min(0),
  branches: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string().min(2),
  ),
  tags: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string().min(2),
  ),
  skills: Joi.alternatives(
    Joi.array().items(Joi.string()),
    Joi.string().min(2),
  ),
  deadline: Joi.string(),
  description: Joi.string().min(20),
  aboutCompany: Joi.string().min(20),
  responsibilities: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(20),
  ),
  requirements: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(10),
  ),
  perks: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(4),
  ),
  process: Joi.alternatives(
    Joi.array().items(Joi.string()).min(1),
    Joi.string().min(4),
  ),
});

const scheduleRoundSchema = Joi.object({
  roundType: Joi.string().valid("aptitude", "technical", "hr", "group_discussion", "final").required(),
  scheduledAt: Joi.string().isoDate().required(),
  venue: Joi.string().optional(),
  notes: Joi.string().optional(),
});

const updateRoundResultSchema = Joi.object({
  result: Joi.string().valid("pass", "fail", "pending").required(),
  notes: Joi.string().optional(),
});

const changeResumeSchema = Joi.object({
  documentId: Joi.string().required(),
});

module.exports = {
  createJobSchema,
  createApplicationSchema,
  uploadDocumentSchema,
  updateApplicantStatusSchema,
  updateJobSchema,
  scheduleRoundSchema,
  updateRoundResultSchema,
  changeResumeSchema,
};
