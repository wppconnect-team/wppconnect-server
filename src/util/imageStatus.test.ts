import { sendImageStatusWithAudience } from './imageStatus';

test('updates the requested audience and returns the send result', async () => {
  const updateParticipants = jest.fn().mockResolvedValue(undefined);
  const sendImageStatus = jest.fn().mockResolvedValue({ id: 'example' });
  (global as any).window = { WPP: { config: {}, status: { updateParticipants, sendImageStatus } } };
  const client = { page: { evaluate: (fn: any, args: any) => fn(args) } };
  const result = await sendImageStatusWithAudience(client, 'data:image/png;base64,iVBORw0KGgo=', { contacts: ['123@c.us'], caption: 'Example' });
  expect(updateParticipants).toHaveBeenCalledWith(['123@c.us']);
  expect(sendImageStatus).toHaveBeenCalledWith(expect.any(String), { caption: 'Example', waitForAck: true });
  expect(result).toEqual({ id: 'example' });
  await sendImageStatusWithAudience(client, 'data:image/png;base64,iVBORw0KGgo=', {});
  expect(updateParticipants).toHaveBeenLastCalledWith(null);
});
