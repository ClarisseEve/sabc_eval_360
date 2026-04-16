function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data };
}

async function login(baseUrl, email, password) {
  const { response, data } = await jsonFetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok || !data?.access_token) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }

  return data.access_token;
}

async function runScenario({ name, iterations, concurrency, task }) {
  const latencies = [];
  let errors = 0;
  let completed = 0;

  async function worker() {
    while (completed < iterations) {
      const current = completed++;
      if (current >= iterations) break;

      const start = performance.now();
      try {
        await task();
      } catch {
        errors += 1;
      } finally {
        latencies.push(performance.now() - start);
      }
    }
  }

  const start = performance.now();
  await Promise.all(Array.from({ length: Math.min(concurrency, iterations) }, () => worker()));
  const duration = performance.now() - start;

  const avg = latencies.length > 0
    ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length
    : 0;

  return {
    name,
    iterations,
    concurrency,
    duration_ms: Math.round(duration),
    avg_ms: Math.round(avg),
    p95_ms: Math.round(percentile(latencies, 95)),
    p99_ms: Math.round(percentile(latencies, 99)),
    errors,
    error_rate: iterations > 0 ? Number(((errors / iterations) * 100).toFixed(2)) : 0,
  };
}

async function authorizedGet(url, token) {
  const { response } = await jsonFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
}

async function authorizedPost(url, token, body) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const { response } = await jsonFetch(url, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${url} failed with ${response.status}`);
  }
}

async function main() {
  const baseUrl = process.env.LOAD_BASE_URL || 'http://localhost:3000';
  const iterations = Number(process.env.LOAD_ITERATIONS || 100);
  const concurrency = Number(process.env.LOAD_CONCURRENCY || 20);
  const loginIterations = Number(process.env.LOAD_LOGIN_ITERATIONS || Math.min(iterations, 5));
  const loginConcurrency = Number(process.env.LOAD_LOGIN_CONCURRENCY || Math.min(concurrency, 2));

  const adminEmail = process.env.LOAD_ADMIN_EMAIL;
  const adminPassword = process.env.LOAD_ADMIN_PASSWORD;
  const userEmail = process.env.LOAD_USER_EMAIL;
  const userPassword = process.env.LOAD_USER_PASSWORD;
  const targetMatricule = process.env.LOAD_TARGET_MATRICULE;
  const validationEvaluationIds = (process.env.LOAD_VALIDATION_EVALUATION_IDS || process.env.LOAD_VALIDATION_EVALUATION_ID || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const validationCycleId = (process.env.LOAD_VALIDATION_CYCLE_ID || '').trim();

  if (!adminEmail || !adminPassword) {
    throw new Error('LOAD_ADMIN_EMAIL and LOAD_ADMIN_PASSWORD are required');
  }

  const adminToken = await login(baseUrl, adminEmail, adminPassword);
  const roleToken = userEmail && userPassword ? await login(baseUrl, userEmail, userPassword) : adminToken;

  const scenarios = [
    {
      name: 'login',
      task: () => login(baseUrl, adminEmail, adminPassword),
    },
    {
      name: 'admin-dashboard',
      task: () => authorizedGet(`${baseUrl}/api/dashboard/admin`, adminToken),
    },
    {
      name: 'role-dashboard',
      task: () => authorizedGet(`${baseUrl}/api/dashboard`, roleToken),
    },
  ];

  if (targetMatricule) {
    scenarios.push({
      name: 'admin-individual-search',
      task: async () => {
        await authorizedGet(`${baseUrl}/api/admin/utilisateurs/${targetMatricule}`, adminToken);
        await authorizedGet(`${baseUrl}/api/admin/utilisateurs/${targetMatricule}/historique`, adminToken);
      },
    });
  }

  if (validationEvaluationIds.length > 0) {
    let validationIndex = 0;
    scenarios.push({
      name: 'evaluation-validation',
      task: () => {
        const evaluationId = validationEvaluationIds[validationIndex % validationEvaluationIds.length];
        validationIndex += 1;
        return authorizedPost(
          `${baseUrl}/api/evaluations/${evaluationId}/validate`,
          roleToken,
          { est_validee: false, commentaire_validation: 'Charge test validation feedback' },
        );
      },
    });
  }

  if (validationCycleId) {
    scenarios.push({
      name: 'evaluation-validation-cycle',
      task: async () => {
        await authorizedPost(`${baseUrl}/api/evaluations/${validationCycleId}/submit`, roleToken);
        await authorizedPost(
          `${baseUrl}/api/evaluations/${validationCycleId}/validate`,
          roleToken,
          { est_validee: false, commentaire_validation: 'Charge test validation feedback' },
        );
      },
    });
  }

  const results = [];
  for (const scenario of scenarios) {
    console.log(`running ${scenario.name}...`);
    results.push(
      await runScenario({
        name: scenario.name,
        iterations: scenario.name === 'login' ? loginIterations : iterations,
        concurrency: scenario.name === 'login' ? loginConcurrency : concurrency,
        task: scenario.task,
      }),
    );
  }

  console.table(results);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
