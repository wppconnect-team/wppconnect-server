export async function deleteMessageWithResult(page: any, chatId: string, messageId: string, deleteMediaInDevice?: boolean, onlyLocal?: boolean): Promise<any> {
  return page.evaluate(async (args: any) => {
    return (window as any).WPP.chat.deleteMessage(args.chatId, args.messageId, args.deleteMediaInDevice, args.revoke);
  }, { chatId, messageId, deleteMediaInDevice: deleteMediaInDevice !== false, revoke: onlyLocal !== true });
}
