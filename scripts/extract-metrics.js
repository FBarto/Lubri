const fs = require('fs');

try {
    const data = fs.readFileSync('lighthouse-mobile.json', 'utf8');
    const report = JSON.parse(data);

    console.log('### Mobile Report Summary');
    console.log(`Performance: ${report.categories.performance.score * 100}`);
    console.log(`Accessibility: ${report.categories.accessibility.score * 100}`);
    console.log(`Best Practices: ${report.categories['best-practices'].score * 100}`);
    console.log(`SEO: ${report.categories.seo.score * 100}`);

    console.log('\n### Core Web Vitals');
    console.log(`FCP: ${report.audits['first-contentful-paint'].displayValue}`);
    console.log(`LCP: ${report.audits['largest-contentful-paint'].displayValue}`);
    console.log(`CLS: ${report.audits['cumulative-layout-shift'].displayValue}`);
    console.log(`TBT: ${report.audits['total-blocking-time'].displayValue}`);
    console.log(`TTI: ${report.audits['interactive'].displayValue}`);

    console.log('\n### Top Opportunities');
    const opportunities = Object.values(report.audits)
        .filter(a => a.details && a.details.type === 'opportunity' && a.score < 0.9)
        .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
        .slice(0, 5)
        .map(a => `- ${a.title} (Savings: ${a.details.overallSavingsMs}ms)`);
    console.log(opportunities.join('\n'));

    console.log('\n### Critical Issues');
    const critical = Object.values(report.audits)
        .filter(a => a.score !== null && a.score < 0.5 && a.score !== 0 && !a.id.startsWith('performance-budget') && !a.id.startsWith('uses-long-cache-ttl'))
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, 5)
        .map(a => `- ${a.title} (Score: ${a.score})`);
    console.log(critical.join('\n'));

} catch (err) {
    console.error('Error:', err);
}
