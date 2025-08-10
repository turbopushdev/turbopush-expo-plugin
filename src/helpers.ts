import { Logger } from './Logger'

export function addStringAndValidate(
  string: string,
  {
    add,
    find,
    tag,
    position = 'AFTER'
  }: {
    add: string
    find?: string
    tag: string
    position?: 'BEFORE' | 'AFTER' | 'START_OF_FILE' | 'END_OF_FILE'
  }
): string {
  if (string.replace(/\n|\t/g, '').includes(add.replace(/\n|\t/g, ''))) {
    Logger.log(`${tag} - ${add} already exists in the file. Skipping...`)
    return string
  }

  if (position === 'START_OF_FILE') {
    return `${add}\n${string}`
  }

  if (position === 'END_OF_FILE') {
    return `${string}\n${add}`
  }

  const newString = string.replace(
    find!,
    position === 'AFTER' ? `${find}\n${add}` : `${add}\n${find}`
  )

  if (!newString.includes(add)) {
    throw new Error(
      `${tag} - Failed to add ${add} to the file. Probably the find parameter cannot be found on file.`
    )
  }

  return newString
}
