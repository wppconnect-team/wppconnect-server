import { isValidCarousel } from './carousel';

test('validates carousel card and recipient limits', () => {
  const card = { image: 'data:image/png;base64,AA==', description: 'Card', buttons: [{ id: 'reply', text: 'Reply' }] };
  expect(isValidCarousel(['recipient'], 'Body', [card, card])).toBe(true);
  expect(isValidCarousel([], 'Body', [card, card])).toBe(false);
  expect(isValidCarousel(['recipient'], 'Body', [card])).toBe(false);
  expect(isValidCarousel(['recipient'], 'Body', [card, { ...card, buttons: [] }])).toBe(false);
  expect(isValidCarousel(['recipient'], 'Body', [card, { ...card, image: 'https://example.com/image.png' }])).toBe(false);
});
