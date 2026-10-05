/** "1 semana", "3 semanas", "1 mês", "2 meses", "10 dias": the usual gap until the next visit. */
export function returnIntervalText(days: number): string {
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30;
    return months === 1 ? "1 mês" : `${months} meses`;
  }
  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1 ? "1 semana" : `${weeks} semanas`;
  }
  return days === 1 ? "1 dia" : `${days} dias`;
}
