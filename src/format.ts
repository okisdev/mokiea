const pad = (value: number) => String(value).padStart(2, '0');

export function date(ms: number): string {
  const value = new Date(ms);
  return `${value.getFullYear() === new Date().getFullYear() ? '' : `${value.getFullYear()}年`}${value.getMonth() + 1}月${value.getDate()}日`;
}

export function dateTime(ms: number, { seconds = false }: { seconds?: boolean } = {}): string {
  const value = new Date(ms);
  const clock = `${pad(value.getHours())}:${pad(value.getMinutes())}${seconds ? `:${pad(value.getSeconds())}` : ''}`;
  return `${date(ms)} ${clock}`;
}
