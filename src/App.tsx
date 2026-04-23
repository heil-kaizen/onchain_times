/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import AppDashboard from './frontend/AppDashboard';
import LandingPage from './frontend/LandingPage';
import TokenDetail from './frontend/TokenDetail';

export default function App() {
  const [route, setRoute] = useState<{ view: 'landing' | 'trading' | 'token'; param: string }>({ view: 'landing', param: '' });
  
  if (route.view === 'landing') {
    return <LandingPage onStart={() => setRoute({ view: 'trading', param: '' })} />;
  }
  
  if (route.view === 'token') {
    return <TokenDetail tokenAddress={route.param} onBack={() => setRoute({ view: 'trading', param: '' })} />;
  }

  return <AppDashboard onBack={() => setRoute({ view: 'landing', param: '' })} onTokenSelect={(address) => setRoute({ view: 'token', param: address })} />;
}
