#!/usr/bin/env node --loader tsx
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  // await page.goto('https://twitter.com/bencmejla/likes');
  await page.goto('https://taras.glek.net/');
  if (1) {
    const client = await page.context().newCDPSession(page);
    const response = await client.send('Accessibility.getFullAXTree');
  console.log(JSON.stringify(response.nodes));
  } else {
  }
  await browser.close();
})();