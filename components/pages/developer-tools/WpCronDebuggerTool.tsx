"use client";
import { useState } from "react";
import { Card, OutputBox, inputClass, buttonClass } from "./shared";

export function WpCronDebuggerTool() {
  const [siteUrl, setSiteUrl] = useState("https://example.com");
  const [cronInterval, setCronInterval] = useState("15");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  async function testCron() {
    setTesting(true);
    setTestResult("Testing wp-cron.php...\n");
    const startTime = Date.now();

    try {
      const cronUrl = `${siteUrl.replace(/\/$/, "")}/wp-cron.php?doing_wp_cron`;
      const response = await fetch(cronUrl, { method: "HEAD", signal: AbortSignal.timeout(10000) });
      const elapsed = Date.now() - startTime;
      setTestResult(`wp-cron.php Response:
Status: ${response.status} ${response.statusText}
Time: ${elapsed}ms
URL: ${cronUrl}

${response.ok ? "✅ wp-cron.php is responding (but this doesn't mean events are firing)" : "❌ wp-cron.php returned an error"}`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      setTestResult(`wp-cron.php Test Result:
Time: ${elapsed}ms
Error: ${err instanceof Error ? err.message : "Request failed"}

⚠️ wp-cron.php may be blocked, timing out, or not accessible.
This is common on shared hosting where WP-Cron is disabled.

Solution: Replace WP-Cron with a real system crontab (see below).`);
    } finally {
      setTesting(false);
    }
  }

  const crontabSnippet = `# WP-Cron System Crontab Entry
# Add this to your server's crontab (via crontab -e)
# This replaces WordPress's unreliable wp-cron.php with a real cron job

# Run every ${cronInterval} minutes:
*/${cronInterval} * * * * curl -s -o /dev/null '${siteUrl.replace(/\/$/, "")}/wp-cron.php?doing_wp_cron' >> /dev/null

# Alternative with wget:
# */${cronInterval} * * * * wget -q -O /dev/null '${siteUrl.replace(/\/$/, "")}/wp-cron.php?doing_wp_cron'

# Then add this to wp-config.php to disable WP's built-in cron:
# define( 'DISABLE_WP_CRON', true );

# To check if cron is working, visit:
# ${siteUrl.replace(/\/$/, "")}/wp-admin/tools.php?page=crontab (requires WP-CLI or cron plugin)`;

  const wpConfigSnippet = `<?php
/**
 * Disable WP-Cron (use system crontab instead)
 * Add to wp-config.php before "That's all, stop editing!"
 */
define( 'DISABLE_WP_CRON', true );

// Optional: Set cron lock timeout (seconds)
// Prevents overlapping cron runs
define( 'CRON_LOCK_TIMEOUT', 120 );

/**
 * After adding the system crontab entry and this constant,
 * WP-Cron will only run via the real cron job, not on page visits.
 * This is more reliable for:
 * - Scheduled posts publishing on time
 * - Plugin/theme scheduled tasks
 * - Cleanup routines
 */`;

  return (
    <div className="space-y-5">
      <Card title="WP-Cron Debugger">
        <p className="text-sm text-slate-600 mb-4">
          Test if wp-cron.php fires correctly and generate a real system crontab replacement. Common fix for &quot;scheduled posts not publishing&quot;.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Site URL</label>
            <input type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className={inputClass} placeholder="https://example.com" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Cron Interval (minutes)</label>
            <select value={cronInterval} onChange={(e) => setCronInterval(e.target.value)} className={inputClass}>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes (recommended)</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button type="button" onClick={testCron} disabled={testing} className={buttonClass}>
            {testing ? "Testing..." : "Test wp-cron.php"}
          </button>
        </div>

        {testResult && (
          <div className="p-4 rounded-xl bg-slate-100 font-mono text-sm text-slate-700 whitespace-pre-wrap">{testResult}</div>
        )}
      </Card>

      <Card title="System Crontab Entry">
        <p className="text-sm text-slate-600 mb-3">
          Replace WP-Cron with a real system cron job for reliable scheduling.
        </p>
      </Card>

      <OutputBox value={crontabSnippet} label="crontab entry" />

      <Card title="wp-config.php: Disable WP-Cron">
        <p className="text-sm text-slate-600 mb-3">
          After setting up the system crontab, disable WordPress&apos;s built-in cron.
        </p>
      </Card>

      <OutputBox value={wpConfigSnippet} label="wp-config.php" />
    </div>
  );
}