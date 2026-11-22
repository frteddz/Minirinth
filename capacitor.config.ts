import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.minirynth.app',
  appName: 'Minirynth',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_minirynth',
      iconColor: '#1BD964',
    },
    BackgroundRunner: {
      label: 'com.minirynth.app.notifications',
      src: 'runners/notifications.js',
      event: 'checkNotifications',
      repeat: true,
      interval: 15,
      autoStart: true,
    },
  },
}

export default config
