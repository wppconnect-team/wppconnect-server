export function normalizeMixedButtons(options: any): any {
  if (!options?.useInteractiveMessage || !Array.isArray(options.buttons)) return options;
  const buttons = options.buttons;
  const hasReply = buttons.some((button: any) => button.id && !button.url && !button.phoneNumber && !button.code && !button.raw);
  if (!hasReply || !buttons.some((button: any) => button.url && !button.raw)) return options;
  return {
    ...options,
    buttons: buttons.map((button: any) => {
      if (button.raw) return button;
      if (button.url) return { raw: { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: button.text, url: button.url }) } };
      if (button.id && !button.phoneNumber && !button.code) return { raw: { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: button.text, id: button.id }) } };
      return button;
    }),
  };
}
