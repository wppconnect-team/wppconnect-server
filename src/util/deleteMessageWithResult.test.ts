import { deleteMessageWithResult } from './deleteMessageWithResult';

test('returns the browser result and forwards deletion options', async () => {
  const page = { evaluate: jest.fn().mockResolvedValue({ deleted: true }) };
  await expect(deleteMessageWithResult(page, 'recipient', 'message', false, true)).resolves.toEqual({ deleted: true });
  expect(page.evaluate.mock.calls[0][1]).toEqual({ chatId: 'recipient', messageId: 'message', deleteMediaInDevice: false, revoke: false });
});

test('defaults to revocation and media deletion', async () => {
  const page = { evaluate: jest.fn().mockResolvedValue(true) };
  await deleteMessageWithResult(page, 'recipient', 'message');
  expect(page.evaluate.mock.calls[0][1]).toEqual({ chatId: 'recipient', messageId: 'message', deleteMediaInDevice: true, revoke: true });
});
