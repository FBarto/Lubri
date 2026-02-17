const fs = require('fs');
const path = require('path');

const mobileReportPath = './lighthouse-mobile.json';
const desktopReportPath = './lighthouse-desktop-3.json';

function analyzeReport(reportPath, type) {
    if (!fs.existsSync(reportPath)) {
        console.log(`Report not found: ${reportPath}`);
        return;
    }

    let report;
    try {
        const raw = fs.readFileSync(reportPath);
        report = JSON.parse(raw);
    } catch (e) {
        console.log(`Failed to parse report at ${reportPath}: ${e.message}`);
        return;
    }

    console.log(`\n### ${type} Analysis`);
    console.log('--------------------------------------------------');

    // Scores
    const scores = {
        Performance: report.categories.performance.score * 100,
        Accessibility: report.categories.accessibility.score * 100,
        'Best Practices': report.categories['best-practices'].score * 100,
        SEO: report.categories.seo.score * 100,
    };
    console.log('Scores:', JSON.stringify(scores, null, 2));

    // Metrics
    const metrics = {
        FCP: report.audits['first-contentful-paint'].displayValue,
        LCP: report.audits['largest-contentful-paint'].displayValue,
        CLS: report.audits['cumulative-layout-shift'].displayValue,
        TBT: report.audits['total-blocking-time'].displayValue,
        TTI: report.audits['interactive'].displayValue,
    };
    console.log('Metrics:', JSON.stringify(metrics, null, 2));

    // Critical Issues (Score 0 or < 0.5)
    const critical = Object.values(report.audits)
        .filter(a => a.score !== null && a.score < 0.5 && a.score !== 0 && !a.id.startsWith('performance-budget')) // some audits have score 0 but act as informative
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, 5)
        .map(a => ({
            id: a.id,
            title: a.title,
            score: a.score,
            displayValue: a.displayValue
        }));

    console.log('Top 5 Critical Issues:', JSON.stringify(critical, null, 2));

    // Improvements (Opportunities)
    const opportunities = Object.values(report.audits)
        .filter(a => a.details && a.details.type === 'opportunity' && a.score < 0.9)
        .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
        .slice(0, 5)
        .map(a => ({
            id: a.id,
            title: a.title,
            savings: a.details.overallSavingsMs
        }));

    console.log('Top 5 Improvements:', JSON.stringify(opportunities, null, 2));

    // Diagnostic specific checks
    const checks = {
        'Viewport': report.audits['viewport'].score === 1 ? 'Pass' : 'Fail',
        'Meta Description': report.audits['meta-description'].score === 1 ? 'Pass' : 'Fail',
        'Image Alt': report.audits['image-alt'].score === 1 ? 'Pass' : 'Fail',
    };
    console.log('Specific Checks:', JSON.stringify(checks, null, 2));
}

analyzeReport(mobileReportPath, 'Mobile');
analyzeReport(desktopReportPath, 'Desktop');
