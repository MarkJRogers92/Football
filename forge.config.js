module.exports = {
  packagerConfig: {
    // Keep the production web build inside the packaged app. The package's
    // productName remains the existing "Dynasty Lab" identity so desktop
    // userData and existing saves remain compatible.
    asar: true,
    appBundleId: 'com.electron.dynasty-lab',
    ignore: [
      /^\/(?:\.git|\.github|\.pages|docs|tests|tools|node_modules)(?:\/|$)/,
    ],
    // macOS will abort a modified Electron bundle whose inherited signature is
    // no longer valid. This local ad-hoc signature makes the Alpha launchable;
    // it is not an Apple Developer ID signature or notarization.
    osxSign: {
      identity: '-',
      identityValidation: false,
      optionsForFile: () => ({
        hardenedRuntime: false,
        timestamp: 'none',
      }),
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
  ],
};
