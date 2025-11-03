/**
 * Performance and Load Testing Script
 *
 * This script provides basic load testing capabilities for the PPBE API.
 * For production use, consider using dedicated tools like k6, Artillery, or Apache Bench.
 */

import http from 'http';

class LoadTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async makeRequest(options) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const url = new URL(options.path, this.baseUrl);

      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = Date.now();
          resolve({
            statusCode: res.statusCode,
            responseTime: endTime - startTime,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async runTest(options, concurrency = 10, totalRequests = 100) {
    console.log(`\n🚀 Starting load test: ${options.method} ${options.path}`);
    console.log(`   Concurrency: ${concurrency}, Total Requests: ${totalRequests}\n`);

    const results = [];
    const batches = Math.ceil(totalRequests / concurrency);

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
      const promises = Array(batchSize).fill(null).map(() => this.makeRequest(options));

      try {
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        process.stdout.write(`Progress: ${results.length}/${totalRequests}\r`);
      } catch (error) {
        console.error('Batch error:', error.message);
      }
    }

    console.log('\n');
    this.results = results;
    return this.getStatistics();
  }

  getStatistics() {
    const responseTimes = this.results.map(r => r.responseTime);
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.length - successCount;

    const stats = {
      totalRequests: this.results.length,
      successCount,
      failureCount,
      successRate: ((successCount / this.results.length) * 100).toFixed(2) + '%',
      avgResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms',
      minResponseTime: Math.min(...responseTimes) + 'ms',
      maxResponseTime: Math.max(...responseTimes) + 'ms',
      p50: this.getPercentile(responseTimes, 50) + 'ms',
      p95: this.getPercentile(responseTimes, 95) + 'ms',
      p99: this.getPercentile(responseTimes, 99) + 'ms'
    };

    this.printStatistics(stats);
    return stats;
  }

  getPercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  printStatistics(stats) {
    console.log('📊 Test Results:');
    console.log('━'.repeat(50));
    console.log(`Total Requests:     ${stats.totalRequests}`);
    console.log(`Successful:         ${stats.successCount} (${stats.successRate})`);
    console.log(`Failed:             ${stats.failureCount}`);
    console.log('');
    console.log('Response Times:');
    console.log(`  Average:          ${stats.avgResponseTime}`);
    console.log(`  Min:              ${stats.minResponseTime}`);
    console.log(`  Max:              ${stats.maxResponseTime}`);
    console.log(`  50th percentile:  ${stats.p50}`);
    console.log(`  95th percentile:  ${stats.p95}`);
    console.log(`  99th percentile:  ${stats.p99}`);
    console.log('━'.repeat(50));
  }
}

// Example usage
async function runLoadTests() {
  const tester = new LoadTester('http://localhost:5000');

  // Test 1: Health check endpoint
  await tester.runTest({
    method: 'GET',
    path: '/api/health'
  }, 10, 100);

  // Test 2: Login endpoint
  await tester.runTest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      username: 'admin',
      password: 'admin123'
    }
  }, 5, 50);

  console.log('\n✅ Load testing completed!\n');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTests().catch(console.error);
}

export default LoadTester;
