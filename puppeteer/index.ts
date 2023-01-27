#!/usr/bin/env node --loader tsx
import puppeteer, { Page } from 'puppeteer';
import { promises as fs } from 'fs';

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

function get_role(node) {
  return node.role.value
}
async function prettyPrintNodes(nodes, outputFile) {
  let output = ''
  let map = new Map<number, any>()
  for (let node of nodes) {
    let key = node.nodeId
    let value = node
    map.set(parseInt(key), value)
  }
  let queue = [1]
  function hasStaticText(node) {
    let role = get_role(node)
    if (role === 'StaticText') {
      return true
    }
    let childIds = node.childIds.map(x => parseInt(x))
    for (let child of childIds) {
      if (hasStaticText(map.get(child))) {
        return true
      }
    }
  }
  while (queue.length) {
    let index = queue.shift() as number
    let node = map.get(index)
    let parentId = node.parentId
    let parent = parentId ? map.get(parseInt(parentId)) : undefined
    node.depth = parent ? parent.depth + 1 : 0
    let indent = ' '.repeat(node.depth)
    let childIds = node.childIds.map(x => parseInt(x))
    let role = get_role(node)
    let value = node.name ? node.name.value : ''
    if (role !== 'none' && role !== 'generic') {
      let line = ''
      if (role === 'StaticText') {
        line = `${indent}${JSON.stringify(value)}`
      } else {
        let properties = node.properties.map(x => x.name + (x.value.value ? `:${x.value.value}` : ''))
        // figure out if this node has text
        let hasStaticTextChild = hasStaticText(node)
        let summary = (!hasStaticTextChild && value.length) ? JSON.stringify(value) : ''
        line = `${indent}${role} ${summary} nodeId:${node.nodeId} ${properties}`
      }
      if (line.length) {
        output += line + '\n'
      }
    }
    if (childIds.length) {
      queue.unshift(...childIds)
      // console.log(queue)
    }
  }
  await fs.writeFile(outputFile, output)
}

/**
 * TODO: connect to own browser via https://medium.com/@jaredpotter1/connecting-puppeteer-to-existing-chrome-window-8a10828149e0
 */
(async () => {
  // set to false to make twitter work
  let headless = false
  const browser = await puppeteer.launch({ headless: headless });
  const page: Page = await browser.newPage();
  let url = process.argv[2]
  // ensure url starts with https://
  if (!url.startsWith('https://')) {
    url = 'https://' + url
  }
  await page.goto(url);
  // sleep for 10 seconds
  if (!headless) {
    await new Promise(resolve => setTimeout(resolve, 10 * 1000));
  }

  // replace all slashes with _ in url to make outputFIle
  let outputFile = url.replace('https://', '').replace(/\//g, '_')
  // console.log((page as any)._client);
  let tree = await getAccessibilityTree(page)
  // console.log(JSON.stringify(tree))
  prettyPrintNodes(tree.nodes, outputFile + '.txt')
  // pretty print tree.node into a .json file
  let data = JSON.stringify(tree.nodes)
  await fs.writeFile(outputFile + '.json', data)
  // console.log(await page.accessibility.snapshot());
  await browser.close();
})();
