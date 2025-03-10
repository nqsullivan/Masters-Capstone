module.exports = function (config) {
    config.set({
      browsers: ['ChromeHeadless'],
      customLaunchers: {
        ChromeHeadlessCI: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox', '--disable-gpu'],
        },
      },
      singleRun: true,
    });
  };
  