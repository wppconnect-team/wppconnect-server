import { normalizeMixedButtons } from './mixedButtons';

test('normalizes mixed reply and URL buttons without mutating the input', () => {
  const options = { useInteractiveMessage: true, buttons: [{ text: 'Reply', id: 'reply' }, { text: 'Visit', url: 'https://example.com' }] };
  const result = normalizeMixedButtons(options);
  expect(result.buttons.map((button: any) => button.raw.name)).toEqual(['quick_reply', 'cta_url']);
  expect(JSON.parse(result.buttons[0].raw.buttonParamsJson).id).toBe('reply');
  expect(options.buttons[0]).toEqual({ text: 'Reply', id: 'reply' });
});

test('preserves unmixed or disabled options', () => {
  const options = { useInteractiveMessage: true, buttons: [{ text: 'Reply', id: 'reply' }] };
  expect(normalizeMixedButtons(options)).toBe(options);
  expect(normalizeMixedButtons(undefined)).toBeUndefined();
});
