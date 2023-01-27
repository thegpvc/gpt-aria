#!/usr/bin/env node --loader tsx
import puppeteer, { Page } from 'puppeteer';

/**
 * need to be able to resolve backendDOMNodeId, following trick should work
 *  https://github.com/puppeteer/puppeteer/issues/3641#issuecomment-655639166
 */

async function getAccessibilityTree(page) {
  let client = (page as any)._client();
  return (await client.send(
    'Accessibility.getFullAXTree',
  ))
}

async function prettyPrintNodes(nodes) {
  let map = new Map<number, any>()
  for (let node of nodes) {
    let key = node.nodeId
    let value = node
    map.set(parseInt(key), value)
  }
  let queue = [1]
  while (queue.length) {
    let index = queue.shift() as number
    let node = map.get(index)
    let parentId = node.parentId
    let parent = parentId ? map.get(parseInt(parentId)) : undefined
    node.depth = parent ? parent.depth + 1 : 0
    let indent = ' '.repeat(node.depth)
    let childIds = node.childIds.map(x => parseInt(x))
    let role = node.role.value
    let value = node.name ? node.name.value : ''
    if (role !== 'none' && role !== 'generic') {
      if (role === 'StaticText') {
        console.log(`${indent}${JSON.stringify(value)}`)
      } else {
        console.log(`${indent}${role}`)// nodeId:${node.nodeId}`)
      }
    }
    if (childIds.length) {
      queue.unshift(...childIds)
      // console.log(queue)
    }
  }
}

(async () => {
  const browser = await puppeteer.launch();
  const page: Page = await browser.newPage();
  await page.goto('https://taras.glek.net');
  // console.log((page as any)._client);
  let tree = await getAccessibilityTree(page)
  // console.log(JSON.stringify(tree))
  prettyPrintNodes(tree.nodes)
  // console.log(await page.accessibility.snapshot());
  await browser.close();
})();
