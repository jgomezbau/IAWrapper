const os = require('os');

function applyRuntimeFlags(app, env = process.env) {
  const features = new Set(['MainThreadCustomScheduler', 'UseSkiaRenderer']);

  const cpuCount = os.cpus().length;
  const rasterThreads = Math.min(Math.max(cpuCount, 2), 8);
  app.commandLine.appendSwitch('num-raster-threads', String(rasterThreads));
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-ipc-flooding-protection');

  const heapMb = Number(env.INCREASE_HEAP_MB) || 4096;
  app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${heapMb}`);

  if (env.DISABLE_HW_ACCEL === '1') {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu-rasterization');
  } else {
    app.commandLine.appendSwitch('enable-gpu-rasterization');
  }

  if (env.FORCE_WAYLAND === '1') {
    app.commandLine.appendSwitch('ozone-platform', 'wayland');
    features.add('UseOzonePlatform');
  }

  if (env.DISABLE_QUIC === '1') {
    app.commandLine.appendSwitch('disable-quic');
  }

  if (env.DISABLE_SMOOTH_SCROLL === '1') {
    app.commandLine.appendSwitch('disable-smooth-scrolling');
  }

  if (env.METAL_THREADS) {
    app.commandLine.appendSwitch('renderer-process-limit', String(env.METAL_THREADS));
  }

  app.commandLine.appendSwitch('enable-features', [...features].join(','));
}

module.exports = { applyRuntimeFlags };
