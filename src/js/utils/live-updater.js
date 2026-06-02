export class LiveUpdater {
  constructor(callback, intervalMs = 30000) {
    this.callback = callback;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.isRunning = false;
    this.lastUpdate = null;
    this.updateCount = 0;
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(async () => {
      try {
        await this.callback();
        this.lastUpdate = new Date();
        this.updateCount++;
        this.updateIndicator();
      } catch (e) {
        console.warn('Live update failed:', e.message);
      }
    }, this.intervalMs);
    this.updateIndicator();
  }
  
  stop() {
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.updateIndicator();
  }
  
  toggle() {
    this.isRunning ? this.stop() : this.start();
  }
  
  updateIndicator() {
    const indicator = document.getElementById('liveIndicator');
    if (!indicator) return;
    const dot = this.isRunning ? '🟢' : '🔴';
    const text = this.isRunning ? `Live • ${Math.round(this.intervalMs/1000)}s` : 'Paused';
    indicator.innerHTML = `${dot} ${text}`;
    indicator.title = this.lastUpdate ? `Last update: ${this.lastUpdate.toLocaleTimeString()}` : 'No updates yet';
  }
}
