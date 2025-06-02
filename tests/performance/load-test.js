import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

// Test data
const testUsers = [
  { email: 'patient1@test.com', password: 'password123', role: 'patient' },
  { email: 'doctor1@test.com', password: 'password123', role: 'doctor' },
  { email: 'admin1@test.com', password: 'password123', role: 'admin' },
];

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Helper functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function authenticateUser(user) {
  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(response, {
    'login successful': (r) => r.status === 200,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);

  if (success && response.json('data')) {
    return response.json('data').token;
  }
  
  return null;
}

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Test scenarios
export default function () {
  const user = getRandomUser();
  const token = authenticateUser(user);
  
  if (!token) {
    console.error('Failed to authenticate user');
    return;
  }

  // Test different endpoints based on user role
  if (user.role === 'patient') {
    testPatientWorkflow(token);
  } else if (user.role === 'doctor') {
    testDoctorWorkflow(token);
  } else if (user.role === 'admin') {
    testAdminWorkflow(token);
  }

  sleep(1); // Think time between requests
}

function testPatientWorkflow(token) {
  const headers = getAuthHeaders(token);

  // Get patient dashboard
  let response = http.get(`${BASE_URL}/api/patients/dashboard`, { headers });
  check(response, {
    'dashboard loaded': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Search for doctors
  response = http.get(`${BASE_URL}/api/patients/doctors?specialty=cardiology&page=1&limit=10`, { headers });
  check(response, {
    'doctor search successful': (r) => r.status === 200,
    'doctor search response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get appointments
  response = http.get(`${BASE_URL}/api/appointments?page=1&limit=10`, { headers });
  check(response, {
    'appointments loaded': (r) => r.status === 200,
    'appointments response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get health metrics
  response = http.get(`${BASE_URL}/api/patients/health-metrics`, { headers });
  check(response, {
    'health metrics loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

function testDoctorWorkflow(token) {
  const headers = getAuthHeaders(token);

  // Get doctor dashboard
  let response = http.get(`${BASE_URL}/api/doctors/dashboard`, { headers });
  check(response, {
    'doctor dashboard loaded': (r) => r.status === 200,
    'doctor dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get today's appointments
  response = http.get(`${BASE_URL}/api/doctors/appointments/today`, { headers });
  check(response, {
    'today appointments loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get availability
  response = http.get(`${BASE_URL}/api/doctors/availability`, { headers });
  check(response, {
    'availability loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get earnings
  response = http.get(`${BASE_URL}/api/doctors/earnings?period=month`, { headers });
  check(response, {
    'earnings loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

function testAdminWorkflow(token) {
  const headers = getAuthHeaders(token);

  // Get admin dashboard
  let response = http.get(`${BASE_URL}/api/admin/dashboard`, { headers });
  check(response, {
    'admin dashboard loaded': (r) => r.status === 200,
    'admin dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get system statistics
  response = http.get(`${BASE_URL}/api/admin/statistics`, { headers });
  check(response, {
    'statistics loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get pending doctor approvals
  response = http.get(`${BASE_URL}/api/admin/doctors/pending`, { headers });
  check(response, {
    'pending doctors loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);

  // Get system health
  response = http.get(`${BASE_URL}/api/admin/health`, { headers });
  check(response, {
    'system health loaded': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

// Smoke test scenario
export function smokeTest() {
  const response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health endpoint accessible': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
}

// Stress test scenario
export function stressTest() {
  const options = {
    stages: [
      { duration: '1m', target: 100 },  // Ramp up to 100 users
      { duration: '5m', target: 100 },  // Stay at 100 users
      { duration: '1m', target: 200 },  // Ramp up to 200 users
      { duration: '5m', target: 200 },  // Stay at 200 users
      { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000'], // More lenient thresholds for stress test
      http_req_failed: ['rate<0.2'],
    },
  };

  return options;
}

// Spike test scenario
export function spikeTest() {
  const options = {
    stages: [
      { duration: '30s', target: 10 },   // Normal load
      { duration: '1m', target: 100 },   // Spike to 100 users
      { duration: '30s', target: 10 },   // Back to normal
      { duration: '1m', target: 200 },   // Bigger spike
      { duration: '30s', target: 10 },   // Back to normal
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'], // Very lenient for spike test
      http_req_failed: ['rate<0.3'],
    },
  };

  return options;
}
