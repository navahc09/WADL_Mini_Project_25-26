const bcrypt = require("bcryptjs");
const { query } = require("../src/db");

const baseUrl = process.env.API_BASE_URL || "http://localhost:5000";

async function ensureAdminUser(email, password) {
  const existing = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
  if (existing.rows[0]) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    `
      INSERT INTO users (display_name, email, password_hash, role, is_active, email_verified)
      VALUES ($1, $2, $3, 'admin', TRUE, TRUE)
    `,
    ["Smoke Admin", email, passwordHash],
  );
}

async function call(name, path, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });

    const durationMs = Date.now() - started;
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (_error) {
      body = text;
    }

    return {
      name,
      method: options.method || "GET",
      path,
      status: response.status,
      ok: response.ok,
      durationMs,
      body,
    };
  } catch (error) {
    return {
      name,
      method: options.method || "GET",
      path,
      status: "ERR",
      ok: false,
      durationMs: Date.now() - started,
      body: { error: error.message },
    };
  }
}

function printResult(result) {
  const bodyPreview = JSON.stringify(result.body).slice(0, 180);
  console.log(`${String(result.status).padEnd(4)} ${result.method.padEnd(6)} ${result.path.padEnd(40)} ${result.durationMs}ms  ${result.name}`);
  if (!result.ok && result.status !== 403 && result.status !== 400 && result.status !== 404 && result.status !== 401) {
    console.log(`      body: ${bodyPreview}`);
  }
}

(async () => {
  const runId = Date.now();
  const email = `smoke.${runId}@example.com`;
  const password = "Password@123";

  const results = [];

  results.push(await call("health", "/health"));

  const registerRes = await call("auth register", "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      fullName: "Smoke User",
      phone: "9876543210",
      rollNumber: `SMK-${runId}`,
      branch: "CSE",
      graduationYear: 2026,
      cgpa: 8.1,
    }),
  });
  results.push(registerRes);

  const loginRes = await call("auth login", "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  results.push(loginRes);

  const accessToken = loginRes.body?.accessToken || registerRes.body?.accessToken;
  const refreshToken = loginRes.body?.refreshToken || registerRes.body?.refreshToken;
  const authHeader = accessToken ? { authorization: `Bearer ${accessToken}` } : {};

  results.push(await call("auth me", "/api/v1/auth/me", { headers: authHeader }));
  results.push(await call("student profile", "/api/v1/students/me/profile", { headers: authHeader }));
  results.push(await call("student dashboard", "/api/v1/students/me/dashboard", { headers: authHeader }));

  results.push(
    await call("student profile update", "/api/v1/students/me/profile", {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({ city: "Bengaluru", headline: "Smoke test profile" }),
    }),
  );

  const jobsListRes = await call("jobs list", "/api/v1/jobs", { headers: authHeader });
  results.push(jobsListRes);
  const firstJobId = Array.isArray(jobsListRes.body) ? jobsListRes.body[0]?.id : null;
  if (firstJobId) {
    results.push(await call("job by id", `/api/v1/jobs/${firstJobId}`, { headers: authHeader }));
  }

  results.push(await call("applications list", "/api/v1/applications", { headers: authHeader }));

  results.push(
    await call("applications create validation", "/api/v1/applications", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({}),
    }),
  );

  const docsListRes = await call("documents list", "/api/v1/documents", { headers: authHeader });
  results.push(docsListRes);
  results.push(
    await call(
      "document access invalid",
      "/api/v1/documents/00000000-0000-4000-8000-000000000000/access",
      { headers: authHeader },
    ),
  );
  const firstDocId = Array.isArray(docsListRes.body) ? docsListRes.body[0]?.id : null;
  if (firstDocId) {
    results.push(await call("document access", `/api/v1/documents/${firstDocId}/access`, { headers: authHeader }));
  }

  results.push(
    await call("documents upload validation", "/api/v1/documents/upload", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({}),
    }),
  );

  results.push(await call("notifications list", "/api/v1/notifications", { headers: authHeader }));

  results.push(await call("admin dashboard as student", "/api/v1/admin/dashboard", { headers: authHeader }));
  results.push(await call("admin jobs as student", "/api/v1/admin/jobs", { headers: authHeader }));
  results.push(await call("auth refresh", "/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  }));
  results.push(await call("auth logout", "/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  }));

  const adminLogin = await call("admin login (seed)", "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "placement.cell@tnpconnect.edu",
      password: "demo1234",
    }),
  });
  results.push(adminLogin);

  if (adminLogin.status === 401) {
    await ensureAdminUser("smoke.admin@example.com", "Admin@1234");
    const fallbackAdminLogin = await call("admin login (smoke)", "/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "smoke.admin@example.com",
        password: "Admin@1234",
      }),
    });
    results.push(fallbackAdminLogin);
    adminLogin.body = fallbackAdminLogin.body;
  }

  const adminToken = adminLogin.body?.accessToken;
  const adminHeader = adminToken ? { authorization: `Bearer ${adminToken}` } : null;

  if (adminHeader) {
    results.push(await call("admin dashboard", "/api/v1/admin/dashboard", { headers: adminHeader }));
    const adminJobsRes = await call("admin jobs", "/api/v1/admin/jobs", { headers: adminHeader });
    results.push(adminJobsRes);

    let adminJobId = Array.isArray(adminJobsRes.body) ? adminJobsRes.body[0]?.id : null;
    if (!adminJobId) {
      const adminCreateRes = await call("admin create job", "/api/v1/admin/jobs", {
        method: "POST",
        headers: adminHeader,
        body: JSON.stringify({
          company: "Smoke Systems",
          title: "Smoke QA Engineer",
          type: "full-time",
          mode: "remote",
          location: "Remote",
          salaryLabel: "INR 10 LPA",
          minCgpa: 6.5,
          branches: ["CSE", "IT"],
          tags: ["QA", "Automation"],
          skills: ["Testing", "Node.js"],
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          description:
            "Smoke-created role to validate admin endpoint wiring and data persistence behavior in local development.",
          responsibilities: ["Build smoke test cases", "Run CI validations"],
          requirements: ["Basic web testing", "API fundamentals"],
          perks: ["Remote", "Mentorship"],
          process: ["Screening", "Technical"],
        }),
      });
      results.push(adminCreateRes);
      adminJobId = adminCreateRes.body?.id || null;
    }

    if (!firstJobId && adminJobId) {
      results.push(await call("job by id", `/api/v1/jobs/${adminJobId}`, { headers: authHeader }));
    }

    if (adminJobId) {
      results.push(
        await call("admin applicants", `/api/v1/admin/jobs/${adminJobId}/applicants`, {
          headers: adminHeader,
        }),
      );
      results.push(
        await call("admin export", `/api/v1/admin/jobs/${adminJobId}/export`, {
          headers: adminHeader,
        }),
      );
      results.push(
        await call("admin patch applicant invalid", `/api/v1/admin/jobs/${adminJobId}/applicants/00000000-0000-4000-8000-000000000000`, {
          method: "PATCH",
          headers: adminHeader,
          body: JSON.stringify({ status: "Shortlisted" }),
        }),
      );
    }
    results.push(await call("admin analytics", "/api/v1/admin/analytics", { headers: adminHeader }));
  }

  console.log("\nAPI smoke results\n");
  for (const result of results) {
    printResult(result);
  }

  const hardFailures = results.filter(
    (r) =>
      !r.ok &&
      ![400, 401, 403, 404, 409].includes(Number(r.status)),
  );

  console.log("\nSummary");
  console.log(`  Total checks: ${results.length}`);
  console.log(`  Hard failures: ${hardFailures.length}`);

  if (hardFailures.length > 0) {
    process.exitCode = 1;
  }
})();
