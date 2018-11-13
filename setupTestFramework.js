const { JSDOM } = require('jsdom')

const jsdom = new JSDOM('<!doctype html><html lang="en"><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.com',
})

const { window } = jsdom

window.requestAnimationFrame = f => setTimeout(f, 16)

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === 'undefined')
    .map(prop => Object.getOwnPropertyDescriptor(src, prop))
  Object.defineProperties(target, props)
}

global.window = window
global.document = window.document
global.navigator = {
  userAgent: 'node.js',
}

copyProps(window, global)
