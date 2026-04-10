const bcrypt = require("bcryptjs");
const { withTransaction } = require("./index");

const ids = {
  studentUser: "11111111-1111-4111-8111-111111111111",
  adminUser: "22222222-2222-4222-8222-222222222222",
  studentProfile: "33333333-3333-4333-8333-333333333333",
  companies: {
    google: "44444444-4444-4444-8444-444444444441",
    microsoft: "44444444-4444-4444-8444-444444444442",
    adobe: "44444444-4444-4444-8444-444444444443",
    atlassian: "44444444-4444-4444-8444-444444444444",
    meta: "44444444-4444-4444-8444-444444444445",
    infosys: "44444444-4444-4444-8444-444444444446",
  },
  jobs: {
    google: "55555555-5555-4555-8555-555555555551",
    microsoft: "55555555-5555-4555-8555-555555555552",
    adobe: "55555555-5555-4555-8555-555555555553",
    atlassian: "55555555-5555-4555-8555-555555555554",
    meta: "55555555-5555-4555-8555-555555555555",
    infosys: "55555555-5555-4555-8555-555555555556",
  },
};

const companies = [
  [ids.companies.google, "Google India", "https://careers.google.com", "Technology"],
  [ids.companies.microsoft, "Microsoft", "https://careers.microsoft.com", "Technology"],
  [ids.companies.adobe, "Adobe", "https://www.adobe.com/careers", "Technology"],
  [ids.companies.atlassian, "Atlassian", "https://www.atlassian.com/company/careers", "Technology"],
  [ids.companies.meta, "Meta AI Lab", "https://www.metacareers.com", "Research"],
  [ids.companies.infosys, "Infosys", "https://www.infosys.com/careers", "Technology"],
];

const jobs = [
  {
    id: ids.jobs.google,
    companyId: ids.companies.google,
    title: "Software Engineer Intern",
    description:
      "Join Google's platform engineering teams to build scalable internal systems, developer tooling, and cloud-native experiences.",
    jobType: "internship",
    workMode: "hybrid",
    location: "Bengaluru",
    salaryLpa: 32,
    salaryLabel: "INR 32 LPA PPO track",
    minCgpa: 8,
    branches: ["CSE", "IT", "ECE"],
    requiredSkills: ["Platform", "Cloud", "Engineering"],
    tags: ["Platform", "Cloud", "Engineering"],
    featured: true,
    openings: 18,
    aboutCompany:
      "Google India partners with universities on cloud, AI, and developer productivity initiatives with a strong focus on long-term engineering growth.",
    responsibilities: [
      "Build internal tools and product features in collaboration with mentors and engineering managers.",
      "Write production-grade frontend and backend code with strong testing discipline.",
      "Participate in design reviews and present technical findings to cross-functional teams.",
    ],
    requirements: [
      "Strong problem-solving fundamentals and knowledge of data structures.",
      "Comfort with JavaScript or TypeScript and at least one backend language.",
      "CGPA 8.0 or higher with no active backlogs.",
    ],
    perks: ["Mentorship cohort", "Housing support", "PPO eligibility"],
    process: ["Online assessment", "Technical interview", "Hiring committee", "Offer rollout"],
    deadline: "2026-04-18T23:59:00+05:30",
    status: "open",
    createdOffsetDays: 2,
  },
  {
    id: ids.jobs.microsoft,
    companyId: ids.companies.microsoft,
    title: "Associate Product Engineer",
    description:
      "Work on enterprise products with emphasis on user-facing features, telemetry, and cloud-scale delivery.",
    jobType: "full_time",
    workMode: "on_site",
    location: "Hyderabad",
    salaryLpa: 22,
    salaryLabel: "INR 22 LPA",
    minCgpa: 7.5,
    branches: ["CSE", "IT", "ECE"],
    requiredSkills: ["Frontend", "Azure", "Product"],
    tags: ["Frontend", "Azure", "Product"],
    featured: true,
    openings: 10,
    aboutCompany:
      "Microsoft's campus hiring program focuses on growth, engineering craft, and building experiences for global enterprise customers.",
    responsibilities: [
      "Develop new product flows in React and C# services.",
      "Collaborate with PMs on experiments and release quality.",
      "Use telemetry to improve adoption and product reliability.",
    ],
    requirements: [
      "Solid computer science fundamentals and an interest in product engineering.",
      "Exposure to databases, APIs, and cloud-hosted systems.",
      "Strong communication and teamwork skills.",
    ],
    perks: ["Learning stipend", "Hybrid flexibility", "Structured onboarding"],
    process: ["Resume shortlist", "Coding round", "Technical panel", "Manager round"],
    deadline: "2026-04-21T23:59:00+05:30",
    status: "open",
    createdOffsetDays: 1,
  },
  {
    id: ids.jobs.adobe,
    companyId: ids.companies.adobe,
    title: "UI Engineering Analyst",
    description:
      "Craft design systems and polished interfaces for collaborative creativity products used by millions.",
    jobType: "full_time",
    workMode: "hybrid",
    location: "Noida",
    salaryLpa: 19,
    salaryLabel: "INR 19 LPA",
    minCgpa: 7.8,
    branches: ["CSE", "IT", "Design Tech"],
    requiredSkills: ["Design Systems", "React", "Accessibility"],
    tags: ["Design Systems", "React", "Accessibility"],
    featured: false,
    openings: 7,
    aboutCompany:
      "Adobe's design engineering teams blend product thinking, visual systems, and robust web platform work.",
    responsibilities: [
      "Translate product requirements into refined interaction design and maintainable UI code.",
      "Contribute to component library architecture and accessibility standards.",
      "Prototype new experiences for creative tooling.",
    ],
    requirements: [
      "Strong frontend foundations with React and CSS.",
      "A sharp eye for detail and accessible design.",
      "Portfolio or projects that show interaction craft.",
    ],
    perks: ["Design mentor", "Creative cloud access", "Flexible work"],
    process: ["Portfolio review", "UI task", "Technical discussion", "Leadership review"],
    deadline: "2026-04-24T23:59:00+05:30",
    status: "draft",
    createdOffsetDays: 4,
  },
  {
    id: ids.jobs.atlassian,
    companyId: ids.companies.atlassian,
    title: "Platform Engineer",
    description:
      "Build the internal platform services that power collaboration products across engineering teams.",
    jobType: "full_time",
    workMode: "remote",
    location: "Remote",
    salaryLpa: 30,
    salaryLabel: "INR 30 LPA",
    minCgpa: 8.2,
    branches: ["CSE", "IT"],
    requiredSkills: ["Platform", "DX", "Remote"],
    tags: ["Platform", "DX", "Remote"],
    featured: false,
    openings: 5,
    aboutCompany:
      "Atlassian invests deeply in developer experience, platform abstractions, and sustainable distributed work practices.",
    responsibilities: [
      "Improve developer tooling for build, deployment, and observability.",
      "Build service APIs and internal self-service workflows.",
      "Partner with cross-functional platform teams on reliability goals.",
    ],
    requirements: [
      "Strong backend or systems interest with frontend fluency.",
      "Comfort with APIs, databases, and cloud infrastructure basics.",
      "CGPA 8.2 or above.",
    ],
    perks: ["Remote-first", "Wellness budget", "Learning leave"],
    process: ["Resume shortlist", "Systems interview", "Pairing round", "Culture round"],
    deadline: "2026-04-29T23:59:00+05:30",
    status: "open",
    createdOffsetDays: 6,
  },
  {
    id: ids.jobs.meta,
    companyId: ids.companies.meta,
    title: "ML Research Intern",
    description:
      "Join a research internship focused on model optimization, evaluation pipelines, and foundation model experimentation.",
    jobType: "internship",
    workMode: "on_site",
    location: "Bengaluru",
    salaryLpa: 38,
    salaryLabel: "INR 38 LPA",
    minCgpa: 9,
    branches: ["CSE", "AI & DS"],
    requiredSkills: ["AI", "Research", "Python"],
    tags: ["AI", "Research", "Python"],
    featured: false,
    openings: 4,
    aboutCompany:
      "Meta AI Lab works on frontier-scale research and values strong mathematics, research execution, and coding rigor.",
    responsibilities: [
      "Run experiments and analyze model outcomes with research scientists.",
      "Implement training and evaluation scripts.",
      "Present findings with reproducible documentation.",
    ],
    requirements: [
      "CGPA 9.0 or above.",
      "Background in ML, probability, and Python tooling.",
      "Prior research or competition work preferred.",
    ],
    perks: ["Research stipend", "Publication exposure", "Mentored cohort"],
    process: ["Research task", "Technical interview", "Research lead review"],
    deadline: "2026-04-17T23:59:00+05:30",
    status: "draft",
    createdOffsetDays: 3,
  },
  {
    id: ids.jobs.infosys,
    companyId: ids.companies.infosys,
    title: "Systems Specialist",
    description:
      "Support cloud migration, client delivery, and enterprise product modernization programs.",
    jobType: "full_time",
    workMode: "hybrid",
    location: "Pune",
    salaryLpa: 9.5,
    salaryLabel: "INR 9.5 LPA",
    minCgpa: 6.5,
    branches: ["CSE"],
    requiredSkills: ["Enterprise", "Cloud", "Delivery"],
    tags: ["Enterprise", "Cloud", "Delivery"],
    featured: false,
    openings: 40,
    aboutCompany:
      "Infosys delivers large-scale digital transformation programs and provides broad entry paths into engineering careers.",
    responsibilities: [
      "Support client engineering teams on migration and modernization initiatives.",
      "Contribute to QA, backend integration, and deployment coordination.",
      "Document delivery metrics and system behavior.",
    ],
    requirements: [
      "Strong willingness to learn and communicate across teams.",
      "Basic programming fluency and SQL familiarity.",
      "No active backlogs.",
    ],
    perks: ["Training academy", "Project mobility", "Mentorship"],
    process: ["Aptitude round", "Technical interview", "HR discussion"],
    deadline: "2026-04-27T23:59:00+05:30",
    status: "open",
    createdOffsetDays: 5,
  },
];

const snapshot = {
  full_name: "Aarav Malhotra",
  email: "aarav.malhotra@university.edu",
  roll_number: "CSE2026-041",
  branch: "Computer Science & Engineering",
  cgpa: 8.74,
  graduation_year: 2026,
  skills: ["React", "Node.js", "Express", "PostgreSQL", "Tailwind CSS"],
  resume_url: "https://signed-url.example/resume",
  tenth_percent: 92.4,
  twelfth_percent: 89.8,
  active_backlogs: 0,
  certifications: [{ name: "AWS Cloud Practitioner" }],
  work_experiences: [{ company: "Campus Tech Lab", role: "Frontend Intern" }],
};

async function seed() {
  const studentPasswordHash = await bcrypt.hash("demo1234", 10);
  const adminPasswordHash = await bcrypt.hash("demo1234", 10);

  await withTransaction(async (client) => {
    await client.query(`
      TRUNCATE TABLE
        document_access_logs,
        interview_rounds,
        applications,
        documents,
        certifications,
        work_experiences,
        notifications,
        jobs,
        companies,
        student_profiles,
        refresh_tokens,
        users
      RESTART IDENTITY CASCADE
    `);

    await client.query(
      `
        INSERT INTO users (id, display_name, email, password_hash, role, is_active, email_verified)
        VALUES
          ($1, 'Aarav Malhotra', 'aarav.malhotra@university.edu', $2, 'student', TRUE, TRUE),
          ($3, 'Placement Cell Admin', 'placement.cell@tnpconnect.edu', $4, 'admin', TRUE, TRUE)
      `,
      [ids.studentUser, studentPasswordHash, ids.adminUser, adminPasswordHash],
    );

    await client.query(
      `
        INSERT INTO student_profiles (
          id, user_id, full_name, phone, address, city, roll_number, branch, branch_code,
          graduation_year, cgpa, active_backlogs, total_backlogs, tenth_percent,
          twelfth_percent, resume_url, resume_s3_key, skills, achievements,
          preferred_locations, preferred_domains, expected_salary_label, headline,
          about, upcoming_events, profile_complete
        )
        VALUES (
          $1, $2, 'Aarav Malhotra', '+91 98765 43210', 'Bengaluru', 'Bengaluru',
          'CSE2026-041', 'Computer Science & Engineering', 'CSE', 2026, 8.74, 0, 0,
          92.4, 89.8, 's3://tnp-platform-documents-demo/resumes/aarav-v6.pdf',
          'resumes/aarav-v6.pdf', $3::text[], $4::text[], $5::text[], $6::text[],
          '18+ LPA', 'Full-stack student building polished products with strong systems thinking.',
          'Full-stack engineering student focused on resilient web products, clean APIs, and thoughtful user experiences.',
          $7::jsonb, TRUE
        )
      `,
      [
        ids.studentProfile,
        ids.studentUser,
        ["React", "Node.js", "Express", "PostgreSQL", "Tailwind CSS", "AWS Basics", "Data Structures"],
        [
          "Finalist, Smart India Hackathon 2025",
          "Open-source contributor to campus ERP tooling",
          "Built internship workflow automation for placement cell",
        ],
        ["Bengaluru", "Hyderabad", "Remote"],
        ["Software Engineering", "Platform", "Data"],
        JSON.stringify([
          { id: "ev-1", title: "Microsoft technical interview", schedule: "12 Apr, 10:00 AM" },
          { id: "ev-2", title: "Resume review workshop", schedule: "14 Apr, 03:30 PM" },
          { id: "ev-3", title: "Google OA result window", schedule: "16 Apr, 05:00 PM" },
        ]),
      ],
    );

    await client.query(
      `
        INSERT INTO certifications (student_id, name, issuer, issued_date, cert_url)
        VALUES
          ($1, 'AWS Cloud Practitioner', 'Amazon Web Services', DATE '2025-08-01', 'https://example.com/aws-cert'),
          ($1, 'Responsive Web Design', 'freeCodeCamp', DATE '2024-11-12', 'https://example.com/fcc-cert')
      `,
      [ids.studentProfile],
    );

    await client.query(
      `
        INSERT INTO work_experiences (student_id, company, role, start_date, end_date, is_current, description)
        VALUES
          ($1, 'Campus Tech Lab', 'Frontend Intern', DATE '2025-05-01', DATE '2025-07-15', FALSE, 'Built dashboards and reusable UI components for campus tools.')
      `,
      [ids.studentProfile],
    );

    await client.query(
      `
        INSERT INTO documents (student_id, doc_type, file_name, s3_key, file_size_bytes, mime_type, is_verified, is_primary, uploaded_at)
        VALUES
          ($1, 'resume', 'Resume_Aarav_Malhotra_v6.pdf', 'resumes/aarav-v6.pdf', 1258291, 'application/pdf', TRUE, TRUE, NOW() - INTERVAL '2 days'),
          ($1, 'cover_letter', 'Cover_Letter_Product_Engineering.pdf', 'documents/aarav-cover-letter.pdf', 843776, 'application/pdf', FALSE, FALSE, NOW() - INTERVAL '7 days'),
          ($1, 'marksheet', 'Semester_7_Marksheet.pdf', 'documents/aarav-sem7.pdf', 2202009, 'application/pdf', TRUE, FALSE, NOW() - INTERVAL '21 days')
      `,
      [ids.studentProfile],
    );

    for (const company of companies) {
      await client.query(
        "INSERT INTO companies (id, name, website, sector) VALUES ($1, $2, $3, $4)",
        company,
      );
    }

    for (const job of jobs) {
      await client.query(
        `
          INSERT INTO jobs (
            id, company_id, created_by, title, description, job_type, work_mode,
            location, salary_lpa, salary_label, min_cgpa, max_active_backlogs,
            allowed_branches, required_skills, tags, graduation_year, featured,
            openings, about_company, responsibilities, requirements, perks, process,
            status, application_deadline, created_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12::text[],
            $13::text[], $14::text[], 2026, $15, $16, $17, $18::text[], $19::text[],
            $20::text[], $21::text[], $22, $23, NOW() - ($24 || ' days')::interval
          )
        `,
        [
          job.id,
          job.companyId,
          ids.adminUser,
          job.title,
          job.description,
          job.jobType,
          job.workMode,
          job.location,
          job.salaryLpa,
          job.salaryLabel,
          job.minCgpa,
          job.branches,
          job.requiredSkills,
          job.tags,
          job.featured,
          job.openings,
          job.aboutCompany,
          job.responsibilities,
          job.requirements,
          job.perks,
          job.process,
          job.status,
          job.deadline,
          String(job.createdOffsetDays),
        ],
      );
    }

    const applications = [
      [ids.jobs.google, "interview_scheduled", 96, "6 days", "0 hours"],
      [ids.jobs.microsoft, "shortlisted", 91, "8 days", "1 day"],
      [ids.jobs.adobe, "offered", 94, "13 days", "2 days"],
      [ids.jobs.atlassian, "applied", 88, "3 days", "4 hours"],
    ];

    for (const [jobId, status, matchScore, appliedAgo, updatedAgo] of applications) {
      await client.query(
        `
          INSERT INTO applications (job_id, student_id, snapshot_data, match_score, status, applied_at, updated_at)
          VALUES ($1, $2, $3::jsonb, $4, $5, NOW() - $6::interval, NOW() - $7::interval)
        `,
        [jobId, ids.studentProfile, JSON.stringify(snapshot), matchScore, status, appliedAgo, updatedAgo],
      );
    }

    await client.query(
      `
        INSERT INTO interview_rounds (
          application_id, round_number, round_type, scheduled_at, location_or_link, result, notes
        )
        SELECT id, 1, 'technical', TIMESTAMPTZ '2026-04-12 10:00:00+05:30', 'Google Meet', 'pending', 'Technical round scheduled'
        FROM applications
        WHERE job_id = $1
      `,
      [ids.jobs.google],
    );

    await client.query(
      `
        INSERT INTO notifications (user_id, title, message, type, is_read, metadata)
        VALUES
          ($1, 'Interview scheduled', 'Microsoft technical interview is scheduled for 12 Apr at 10:00 AM.', 'status_update', FALSE, $2::jsonb),
          ($1, 'Resume updated', 'Your primary resume version is now attached to new applications.', 'document_update', TRUE, '{}'::jsonb)
      `,
      [ids.studentUser, JSON.stringify({ job_id: ids.jobs.microsoft })],
    );
  });

  console.log("[seed] database seeded");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
