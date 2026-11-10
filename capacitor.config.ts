// Three Android apps from one project: APP=tenant (default) → Efie Wura, APP=owner → Efie Wura Owner, APP=admin → Efie Wura Admin.
import type { CapacitorConfig } from '@capacitor/cli';

const APP = (process.env.APP || 'tenant') as 'tenant' | 'owner' | 'admin';
const META = {
  tenant: { id: 'com.efiewura.tenant', name: 'Efie Wura' },
  owner: { id: 'com.efiewura.owner', name: 'Efie Wura Owner' },
  admin: { id: 'com.efiewura.admin', name: 'Efie Wura Admin' },
}[APP];

const config: CapacitorConfig = {
  appId: META.id,
  appName: META.name,
  webDir: `build/${APP}`,
  android: { path: `android-${APP}`, backgroundColor: '#072e25' },
  plugins: {
    SplashScreen: { launchShowDuration: 1500, launchAutoHide: true, backgroundColor: '#072e25', androidScaleType: 'CENTER_CROP', showSpinner: false },
    StatusBar: { backgroundColor: '#072e25', style: 'DARK' },
  },
};

export default config;
