export default {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 1920,
      unitPrecision: 5,
      viewportUnit: 'vw',
      // Keep text readable at every viewport width.
      propList: ['*', '!font*', '!line-height', '!letter-spacing'],
      minPixelValue: 1,
      mediaQuery: false,
      // Preserve component defaults and the existing mobile layout.
      exclude: [/node_modules/, /[/\\]responsive\.css$/],
      // These dimensions share pixel coordinates with the timeline drag logic.
      selectorBlackList: [
        '.gantt',
        '.table-head',
        '.member-cell',
        '.date-header',
        '.date-cell',
        '.project-cell',
        '.project-timeline',
        '.project-cycle-bar',
        '.member-timeline',
        '.grid-days',
        '.task-bar',
        '.resize-handle',
        '.add-member',
        '.empty-timeline',
        // Keep controls and dialog bounds usable alongside pixel-sized text.
        '.el-',
        '.edit-dialog',
        '.details-dialog',
        '.preview-dialog',
        '.detail-progress',
        '.person-select',
        '.icon-btn',
        '.avatar',
        '.project-icon',
        '.project-symbol',
      ],
    },
  },
}
