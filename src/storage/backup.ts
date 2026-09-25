import { BackupSchema } from '../domain/models'
import type { TrainingRepository } from './database'

const MAX_BACKUP_CHARACTERS = 5_000_000

export async function exportBackup (
  repository: TrainingRepository,
  now = new Date()
) {
  const backup = await repository.createBackup(now.toISOString())
  return JSON.stringify(backup, null, 2)
}

export async function importBackup (repository: TrainingRepository, json: string) {
  if (json.length > MAX_BACKUP_CHARACTERS) throw new Error('Backup file is too large')

  const decoded: unknown = JSON.parse(json)
  const backup = BackupSchema.parse(decoded)
  await repository.replaceFromBackup(backup)
}
