module.exports = {
  appId: 'com.vitinhoww.idlemanager',
  productName: 'Idle Manager',
  directories: {
    output: 'dist',
    buildResources: 'assets'
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*'
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }]
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Idle Manager'
  },
  publish: {
    provider: 'github',
    owner: 'Vitinhoww',
    repo: 'idle-manager'
  }
}
