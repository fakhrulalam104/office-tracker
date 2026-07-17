"use client";
import { useState } from "react";
import { Card, OutputBox, buttonClass } from "./shared";

interface DiagnosticStep {
  id: string;
  question: string;
  yesAction?: string;
  noAction?: string;
  fix?: string;
  snippet?: string;
}

const DIAGNOSTIC_TREE: Record<string, DiagnosticStep> = {
  start: {
    id: "start",
    question: "Is your site completely blank (white screen) or showing an error message?",
    yesAction: "blank",
    noAction: "error_msg",
  },
  blank: {
    id: "blank",
    question: "Can you access wp-admin? (Try /wp-login.php)",
    yesAction: "admin_works",
    noAction: "admin_broken",
  },
  admin_works: {
    id: "admin_works",
    question: "Does the issue happen with all themes, or just your current theme?",
    yesAction: "all_themes",
    noAction: "theme_issue",
  },
  theme_issue: {
    id: "theme_issue",
    question: "Switch to a default theme (Twenty Twenty-Four) via Appearance > Themes. Does it fix it?",
    fix: "Your theme has a PHP error. Check the error log or enable WP_DEBUG to see the specific error.",
    snippet: `// Add to wp-config.php to see the error:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', true );`,
  },
  all_themes: {
    id: "all_themes",
    question: "Deactivate ALL plugins via FTP/SFTP (rename wp-content/plugins to plugins_old). Does it work now?",
    yesAction: "plugin_conflict",
    noAction: "not_plugin",
  },
  plugin_conflict: {
    id: "plugin_conflict",
    question: "Reactivate plugins one by one to find the culprit. Found it?",
    fix: "The last activated plugin before the white screen returns is the problem. Update or replace it.",
    snippet: `// To manually deactivate a plugin in the database:
// Run this SQL:
UPDATE wp_options SET option_value = 'a:0:{}' WHERE option_name = 'active_plugins';

// Or rename the plugin folder:
// mv wp-content/plugins/problematic-plugin wp-content/plugins/problematic-plugin.bak`,
  },
  not_plugin: {
    id: "not_plugin",
    question: "Check if memory is exhausted. Enable WP_DEBUG and check wp-content/debug.log",
    fix: "Increase memory limit or check for infinite loops/recursion.",
    snippet: `// Add to wp-config.php:
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

// Check debug.log for errors:
// tail -100 wp-content/debug.log`,
  },
  admin_broken: {
    id: "admin_broken",
    question: "Can you access the site via FTP? Check if wp-config.php exists and is correct.",
    yesAction: "check_wpconfig",
    noAction: "no_ftp",
  },
  check_wpconfig: {
    id: "check_wpconfig",
    question: "Does wp-config.php have correct DB credentials? Try re-downloading wp-config-sample.php, fill in credentials, save as wp-config.php.",
    fix: "Database connection issues are a common cause of WSoD.",
    snippet: `// Test DB connection by adding this temporary code:
// Place at the top of wp-config.php:
echo 'Testing DB connection...';
$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($db->connect_error) {
    die('DB Connection Failed: ' . $db->connect_error);
}
echo 'DB Connected OK!';
die(); // Remove after testing`,
  },
  no_ftp: {
    id: "no_ftp",
    question: "Contact your host. The issue may be server-level (PHP crashed, disk full, etc.)",
    fix: "Ask host to check: PHP error logs, disk space, server resource limits, and if PHP version is compatible with your WordPress version.",
  },
  error_msg: {
    id: "error_msg",
    question: "What error message do you see? Common ones: 'Allowed memory size exhausted', 'Error establishing database connection', 'Briefly unavailable for scheduled maintenance'",
    fix: "See the WP Error Lookup tool for specific error fixes, or check the snippets below for the most common errors.",
    snippet: `// Most common error fixes:

// 1. "Allowed memory size exhausted"
define( 'WP_MEMORY_LIMIT', '256M' );

// 2. "Error establishing database connection"
// Check wp-config.php DB credentials

// 3. "Briefly unavailable for scheduled maintenance"
// Delete .maintenance file from WordPress root

// 4. "There has been a critical error"
// Enable debug to see the error:
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );`,
  },
};

export function WhiteScreenChecklistTool() {
  const [currentStep, setCurrentStep] = useState<string>("start");
  const [history, setHistory] = useState<string[]>([]);

  const step = DIAGNOSTIC_TREE[currentStep];

  function answer(choice: "yes" | "no" | "fix") {
    setHistory((prev) => [...prev, currentStep]);
    if (choice === "yes" && step.yesAction) {
      setCurrentStep(step.yesAction);
    } else if (choice === "no" && step.noAction) {
      setCurrentStep(step.noAction);
    }
  }

  function goBack() {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentStep(prev);
    }
  }

  function reset() {
    setCurrentStep("start");
    setHistory([]);
  }

  return (
    <div className="space-y-5">
      <Card title="WP White Screen of Death Checklist">
        <p className="text-sm text-slate-600 mb-4">
          Interactive diagnostic tree to identify and fix the most common causes of WordPress white screen.
        </p>

        <div className="space-y-4">
          {history.length > 0 && (
            <button type="button" onClick={goBack} className="text-sm text-sky-700 hover:text-sky-900">
              ← Back to previous step
            </button>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-sm font-semibold text-slate-800 mb-4">{step.question}</p>

            {step.fix && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                  <strong>Fix:</strong> {step.fix}
                </div>
                <button type="button" onClick={reset} className="text-sm text-sky-700 hover:text-sky-900">
                  Start over
                </button>
              </div>
            )}

            {!step.fix && (
              <div className="flex gap-3">
                {step.yesAction && (
                  <button type="button" onClick={() => answer("yes")} className={buttonClass}>Yes</button>
                )}
                {step.noAction && (
                  <button type="button" onClick={() => answer("no")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    No / Different issue
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {step.snippet && (
        <OutputBox value={step.snippet} label="Fix Snippet" />
      )}
    </div>
  );
}