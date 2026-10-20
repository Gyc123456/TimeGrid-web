import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import postcss from 'postcss'
import pxToViewport from 'postcss-px-to-viewport'
import config from '../postcss.config.js'

const options = config.plugins['postcss-px-to-viewport']
const stylesDirectory = new URL('../src/styles/', import.meta.url)

async function transform(css, from = 'src/styles/layout.css') {
  return (await postcss([pxToViewport(options)]).process(css, { from })).root
}

function declarations(root, property) {
  const values = []
  root.walkDecls(property, (declaration) => values.push(declaration.value))
  return values
}

test('布局尺寸转换为 vw，同时保持最小字号和细边框', async () => {
  const root = await transform(
    '.sample { width: 192px; padding: 24px; border: 1px solid; font-size: 12px; line-height: 20px; }',
  )
  assert.deepEqual(declarations(root, 'width'), ['10vw'])
  assert.deepEqual(declarations(root, 'padding'), ['1.25vw'])
  assert.deepEqual(declarations(root, 'border'), ['1px solid'])
  assert.deepEqual(declarations(root, 'font-size'), ['12px'])
  assert.deepEqual(declarations(root, 'line-height'), ['20px'])
})

test('组件库和移动端适配保留像素尺寸，兼容 Windows 路径', async () => {
  for (const from of [
    'src/styles/responsive.css',
    'C:\\workspace\\src\\styles\\responsive.css',
    'node_modules/element-plus/theme-chalk/index.css',
    'C:\\workspace\\node_modules\\element-plus\\theme-chalk\\index.css',
  ]) {
    const root = await transform('.sample { width: 135px; }', from)
    assert.deepEqual(declarations(root, 'width'), ['135px'], from)
  }
})

test('时间轴、筛选和弹窗尺寸保持可操作，媒体查询断点保持不变', async () => {
  const root = await transform(`
    .gantt { grid-template-columns: 440px var(--timeline-width); }
    .member-cell { height: 66px; }
    .person-select { width: 135px; }
    .details-dialog { max-height: calc(100dvh - 40px); }
    @media (max-width: 800px) { .sample { padding: 14px; } }
  `)
  assert.deepEqual(declarations(root, 'grid-template-columns'), ['440px var(--timeline-width)'])
  assert.deepEqual(declarations(root, 'height'), ['66px'])
  assert.deepEqual(declarations(root, 'width'), ['135px'])
  assert.deepEqual(declarations(root, 'max-height'), ['calc(100dvh - 40px)'])
  root.walkAtRules('media', (rule) => assert.equal(rule.params, '(max-width: 800px)'))
  assert.deepEqual(declarations(root, 'padding'), ['14px'])
})

test('全部业务样式的字号至少 12px，并且转换后仍以 px 为单位', async () => {
  for (const filename of await readdir(stylesDirectory)) {
    if (!filename.endsWith('.css')) continue
    const url = new URL(filename, stylesDirectory)
    const root = await transform(await readFile(url, 'utf8'), url.pathname)
    root.walkDecls('font-size', (declaration) => {
      assert.match(declaration.value, /^\d+(?:\.\d+)?px$/, `${filename}: ${declaration.value}`)
      assert.ok(parseFloat(declaration.value) >= 12, `${filename}: ${declaration.value}`)
    })
  }
})
