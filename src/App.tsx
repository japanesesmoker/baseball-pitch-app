import { useStore } from './store/useStore';
import { MenuScreen } from './screens/MenuScreen';
import { PitcherSelectionScreen } from './screens/PitcherSelectionScreen';
import { BatterSelectionScreen } from './screens/BatterSelectionScreen';
import { PitchDisplayScreen } from './screens/PitchDisplayScreen';
import { ResultSelectionScreen } from './screens/ResultSelectionScreen';
import { DataScreen } from './screens/DataScreen';
import { DataLoadScreen } from './screens/DataLoadScreen';
import { DataViewScreen } from './screens/DataViewScreen';
import { DataViewPatternsScreen } from './screens/DataViewPatternsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export default function App() {
  const screen = useStore((s) => s.screen);

  return (
    <div className="max-w-md mx-auto min-h-screen">
      {screen === 'menu' && <MenuScreen />}
      {screen === 'pitcher-selection' && <PitcherSelectionScreen />}
      {screen === 'batter-selection' && <BatterSelectionScreen />}
      {screen === 'pitch-display' && <PitchDisplayScreen />}
      {screen === 'result-selection' && <ResultSelectionScreen />}
      {screen === 'data' && <DataScreen />}
      {screen === 'data-load' && <DataLoadScreen />}
      {screen === 'data-view' && <DataViewScreen />}
      {screen === 'data-view-patterns' && <DataViewPatternsScreen />}
      {screen === 'settings' && <SettingsScreen />}
    </div>
  );
}
