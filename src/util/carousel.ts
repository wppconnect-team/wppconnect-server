export function isValidCarousel(phone: any, body: any, cards: any): boolean {
  return Array.isArray(phone) && phone.length > 0 && phone.every((value: any) => typeof value === 'string' && value.length > 0) &&
    typeof body === 'string' && Array.isArray(cards) && cards.length >= 2 && cards.length <= 10 &&
    cards.every((card: any) => card && typeof card.image === 'string' && card.image.startsWith('data:image/') &&
      typeof card.description === 'string' && Array.isArray(card.buttons) && card.buttons.length >= 1 && card.buttons.length <= 3);
}
