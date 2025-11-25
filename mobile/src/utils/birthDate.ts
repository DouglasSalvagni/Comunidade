export type BirthDateValidationResult = {
  iso: string | null
  error?: 'invalid' | 'future'
}

export function validateBirthDate(input: string): BirthDateValidationResult {
  const trimmed = (input || '').trim()
  if (!trimmed) return { iso: null }

  const parts = trimmed.split('/')
  if (parts.length !== 3) return { iso: null, error: 'invalid' }

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)

  if (![day, month, year].every((value) => Number.isInteger(value))) {
    return { iso: null, error: 'invalid' }
  }

  const candidate = new Date(year, month - 1, day)
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return { iso: null, error: 'invalid' }
  }

  const normalizedCandidate = new Date(candidate)
  normalizedCandidate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (normalizedCandidate.getTime() > today.getTime()) {
    return { iso: null, error: 'future' }
  }

  const iso = `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`

  return { iso }
}
