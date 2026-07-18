import { NextRequest } from 'next/server'
import { z } from 'zod'
import { validatePineScript } from '@/engines/validation-engine'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

const validateSchema = z.object({
  pineScript: z.string().min(1),
})

// Run the Python guard script
async function runGuardScript(pineScript: string): Promise<{ errors: string[]; warnings: string[] }> {
  const tmpFile = join(tmpdir(), `pine_v6_${Date.now()}.pine`)

  try {
    await writeFile(tmpFile, pineScript, 'utf-8')

    const { stdout, stderr } = await execAsync(
      `python3 ${join(process.cwd(), 'scripts/pine_v6_guard.py')} ${tmpFile}`,
      { timeout: 10000 }
    )

    const errors: string[] = []
    const warnings: string[] = []

    for (const line of stdout.split('\n')) {
      if (line.startsWith('[ERROR]')) {
        errors.push(line.replace('[ERROR] ', ''))
      } else if (line.startsWith('[WARNING]')) {
        warnings.push(line.replace('[WARNING] ', ''))
      }
    }

    if (stderr) {
      errors.push(`Guard script error: ${stderr}`)
    }

    return { errors, warnings }
  } catch (error: any) {
    // Guard script returns exit code 1 for errors
    if (error.stdout) {
      const errors: string[] = []
      const warnings: string[] = []

      for (const line of error.stdout.split('\n')) {
        if (line.startsWith('[ERROR]')) {
          errors.push(line.replace('[ERROR] ', ''))
        } else if (line.startsWith('[WARNING]')) {
          warnings.push(line.replace('[WARNING] ', ''))
        }
      }

      return { errors, warnings }
    }

    return { errors: [`Guard script execution failed: ${error.message}`], warnings: [] }
  } finally {
    // Clean up temp file
    await unlink(tmpFile).catch(() => {})
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const result = validateSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { pineScript } = result.data

    // Run TypeScript validation (fast, always runs)
    const tsValidation = validatePineScript(pineScript)

    // Run Python guard script (more thorough, checks v6-specific issues)
    let guardResults = { errors: [] as string[], warnings: [] as string[] }
    try {
      guardResults = await runGuardScript(pineScript)
    } catch {
      // Guard script not available, use only TS validation
    }

    // Combine results
    const allErrors = [
      ...tsValidation.errors.map(e => ({
        source: 'validator' as const,
        code: e.code || 'UNKNOWN',
        message: e.message,
        line: e.line,
      })),
      ...guardResults.errors.map(e => ({
        source: 'guard' as const,
        code: e.match(/\[([^\]]+)\]/)?.[1] || 'GUARD',
        message: e,
        line: undefined,
      })),
    ]

    const allWarnings = [
      ...tsValidation.warnings.map(w => ({
        source: 'validator' as const,
        code: w.code || 'UNKNOWN',
        message: w.message,
        line: w.line,
      })),
      ...guardResults.warnings.map(w => ({
        source: 'guard' as const,
        code: w.match(/\[([^\]]+)\]/)?.[1] || 'GUARD',
        message: w,
        line: undefined,
      })),
    ]

    return Response.json({
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return Response.json(
      { error: 'Validation failed' },
      { status: 500 }
    )
  }
}
