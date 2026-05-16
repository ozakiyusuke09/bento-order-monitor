export function todayString() {
  return dateString(new Date());
}

export function dateString(date: Date) {
  const now = date;
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysString(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return dateString(next);
}

export function tomorrowString() {
  return addDaysString(todayString(), 1);
}

export function displayDate(date: string) {
  return date.replaceAll("-", "/");
}

export function displayTime(time: string) {
  return time.slice(0, 5);
}

export function displayDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function isPickupSoon(date: string, time: string) {
  const target = new Date(`${date}T${time}`);
  const diff = target.getTime() - Date.now();
  return diff > 0 && diff <= 60 * 60 * 1000;
}
