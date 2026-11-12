const pad = (value) => String(value).padStart(2, '0')

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date, months) {
  const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate()
  targetMonth.setDate(Math.min(date.getDate(), lastDay))
  return targetMonth
}

export function getWeekDates(date) {
  const mondayOffset = (date.getDay() + 6) % 7
  const monday = addDays(date, -mondayOffset)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function getMonthGridDates(date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const daysBeforeMonth = (firstOfMonth.getDay() + 6) % 7
  const gridStart = addDays(firstOfMonth, -daysBeforeMonth)
  const weekCount = Math.ceil((daysBeforeMonth + daysInMonth) / 7)
  return Array.from({ length: weekCount * 7 }, (_, index) => addDays(gridStart, index))
}
