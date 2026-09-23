const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';

/** Wipes the Mailpit inbox so a test starts from a known state. */
export async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}

/** Polls Mailpit for the message sent to `toEmail` and returns its 6-digit code. */
export async function getVerificationCode(toEmail: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const query = encodeURIComponent(`to:${toEmail}`);
    const list = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`).then(
      (r) => r.json() as Promise<{ messages: { ID: string }[] }>,
    );
    const message = list.messages?.[0];
    if (message) {
      const full = await fetch(
        `${MAILPIT_URL}/api/v1/message/${message.ID}`,
      ).then((r) => r.json() as Promise<{ Text?: string }>);
      const match = /\b(\d{6})\b/.exec(full.Text ?? '');
      if (match) return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No verification email arrived for ${toEmail}`);
}
