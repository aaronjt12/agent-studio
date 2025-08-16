import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { spawn } from 'child_process';

const router = Router();

const EXEC_MODE = (process.env.TERMINAL_EXEC_MODE || 'host').toLowerCase();
const DOCKER_CONTAINER = process.env.TERMINAL_DOCKER_CONTAINER || '';
const ENV_WHITELIST = (process.env.TERMINAL_ENV_WHITELIST || 'OPENAI_API_KEY,ANTHROPIC_API_KEY')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Whitelist of allowed CLI binaries
const ALLOWED_CMDS = new Set(['claude', 'openai']);

function buildExec(cmd: string, args: string[]): { command: string; args: string[] } {
  if (EXEC_MODE === 'docker') {
    if (!DOCKER_CONTAINER) {
      throw new Error('TERMINAL_DOCKER_CONTAINER must be set when TERMINAL_EXEC_MODE=docker');
    }
    const dockerArgs: string[] = ['exec', '-i'];
    // pass selected env vars
    for (const key of ENV_WHITELIST) {
      if (process.env[key]) {
        dockerArgs.push('-e', `${key}=${process.env[key]}`);
      }
    }
    dockerArgs.push(DOCKER_CONTAINER, cmd, ...args);
    return { command: 'docker', args: dockerArgs };
  }
  // host mode
  return { command: cmd, args };
}

function runCommand(cmd: string, args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let commandToRun: string;
    let finalArgs: string[];
    try {
      const exec = buildExec(cmd, args);
      commandToRun = exec.command;
      finalArgs = exec.args;
    } catch (e: any) {
      return resolve({ exitCode: -1, stdout: '', stderr: e?.message || String(e) });
    }

    const child = spawn(commandToRun, finalArgs, { shell: process.platform === 'win32' });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ exitCode: code ?? -1, stdout, stderr });
    });
  });
}

// POST /api/terminal/exec - execute whitelisted CLI commands
router.post(
  '/exec',
  [
    body('command').isString().trim().notEmpty(),
    body('args').optional().isArray(),
  ],
  async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { command, args = [] } = req.body as { command: string; args?: string[] };
      const binary = command.split(/[\\/]/).pop() || command; // last path segment

      if (!ALLOWED_CMDS.has(binary)) {
        return res.status(400).json({ error: `Command not allowed: ${binary}` });
      }

      // Basic arg sanitation: ensure array of strings and cap length
      const argList = Array.isArray(args) ? args.slice(0, 50).map(String) : [];

      const { exitCode, stdout, stderr } = await runCommand(binary, argList);
      res.json({ exitCode, stdout, stderr });
    } catch (error) {
      console.error('Terminal exec error:', error);
      res.status(500).json({ error: 'Failed to execute command' });
    }
  }
);

// GET /api/terminal/check - check availability of CLIs
router.get('/check', async (req: AuthenticatedRequest, res) => {
  try {
    const checks = await Promise.all(
      Array.from(ALLOWED_CMDS).map(async (cmd) => {
        const result = await runCommand(cmd, ['--version']);
        return { id: cmd, installed: result.exitCode === 0, version: result.stdout.trim() || result.stderr.trim() };
      })
    );
    res.json({ tools: checks, execMode: EXEC_MODE, container: EXEC_MODE === 'docker' ? DOCKER_CONTAINER : undefined });
  } catch (error) {
    console.error('Terminal check error:', error);
    res.status(500).json({ error: 'Failed to check tools' });
  }
});

export default router;


