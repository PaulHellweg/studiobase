#!/usr/bin/env node
// Stop hook — fires when Claude tries to end a session.
// Blocks if there's an open approval gate or uncompleted tasks.
// Uses a lockfile to prevent repeated blocking on the same gate.

import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const LOCK_DIR = join(tmpdir(), 'studiobase-hooks');
const LOCK_FILE = join(LOCK_DIR, 'verify-completion.lock');

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  if (!existsSync('studio/task_plan.md')) {
    process.exit(0); // No pipeline active
  }

  const plan = readFileSync('studio/task_plan.md', 'utf8');

  // Check for open approval gate
  const statusMatch = plan.match(/current_status:\s*(\S+)/);
  const status = statusMatch?.[1] || '';

  if (status === 'awaiting_approval') {
    const phaseMatch = plan.match(/current_phase:\s*(\S+)/);
    const phase = phaseMatch?.[1] || '?';
    const lockKey = `awaiting_approval:${phase}`;

    // Check if we already blocked for this exact gate
    try {
      if (existsSync(LOCK_FILE)) {
        const existing = readFileSync(LOCK_FILE, 'utf8').trim();
        if (existing === lockKey) {
          // Already blocked once for this gate — don't block again
          console.error(`[verify-completion] (Phase ${phase} still awaiting approval — already notified)`);
          process.exit(0);
        }
      }
    } catch {}

    // First time blocking for this gate — write lock and block
    try {
      mkdirSync(LOCK_DIR, { recursive: true });
      writeFileSync(LOCK_FILE, lockKey);
    } catch {}

    console.error(`[verify-completion] BLOCKED: Phase ${phase} is awaiting human approval.`);
    console.error('[verify-completion] Present the phase output to the human and wait for /df:approve before ending.');
    process.exit(2);
  }

  // Gate passed or not active — clean up lock file
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
  } catch {}

  // Check for open tasks in current phase (warn only, don't block)
  const openTasks = (plan.match(/^\s*- \[ \] .+/gm) || []);
  if (openTasks.length > 0 && status === 'in_progress') {
    console.error(`[verify-completion] NOTE: ${openTasks.length} open task(s) in current phase.`);
  }

  process.exit(0);
});
