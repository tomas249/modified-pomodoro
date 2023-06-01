export function generateUUID() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function parseDurationToInt(duration: string) {
  const [hours, minutes] = duration.split(':');
  return parseInt(hours) * 60 + parseInt(minutes);
}

export function parseDurationToString(duration: number) {
  const minutes = duration % 60;
  const hours = (duration - minutes) / 60;
  return `${hours}:${addZero(minutes)}`;
}

export function parseDurationToHHMM(duration: number) {
  const minutes = duration % 60;
  const hours = (duration - minutes) / 60;
  return `${addZero(hours)}:${addZero(minutes)}`;
}

function addZero(num: number) {
  return num < 10 ? `0${num}` : num;
}

export function fromArrayToObject<T extends {}>(arr: T[], key: keyof T): Record<string, T> {
  return arr.reduce((acc, item) => {
    acc[String(item[key])] = item
    return acc
  }, {} as Record<string, T>)
}

export function toByField<T extends { [key: string]: unknown }>(array: T[], field: string) {
  return fromArrayToObject(array, field)
}