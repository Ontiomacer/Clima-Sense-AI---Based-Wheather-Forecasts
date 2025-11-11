import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Thermometer, CloudRain, Leaf, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface SimulatorProps {
  onScenarioChange: (scenario: { type: string; adjustment: number }) => void;
}

const ScenarioSimulator = ({ onScenarioChange }: SimulatorProps) => {
  const [tempAdjustment, setTempAdjustment] = useState([0]);
  const [rainAdjustment, setRainAdjustment] = useState([0]);
  const [activeTab, setActiveTab] = useState('temperature');

  const handleReset = () => {
    setTempAdjustment([0]);
    setRainAdjustment([0]);
    onScenarioChange({ type: activeTab, adjustment: 0 });
  };

  const handleApply = () => {
    const adjustment = activeTab === 'temperature' ? tempAdjustment[0] : rainAdjustment[0];
    onScenarioChange({ type: activeTab, adjustment });
  };

  return (
    <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-indigo-600" />
          What-If Climate Simulator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Model future outcomes based on climate change scenarios
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="temperature">
              <Thermometer className="w-4 h-4 mr-2" />
              Temperature
            </TabsTrigger>
            <TabsTrigger value="rainfall">
              <CloudRain className="w-4 h-4 mr-2" />
              Rainfall
            </TabsTrigger>
            <TabsTrigger value="vegetation">
              <Leaf className="w-4 h-4 mr-2" />
              Vegetation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="temperature" className="space-y-4 mt-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Temperature Change</label>
                <span className="text-sm font-bold text-indigo-600">
                  {tempAdjustment[0] > 0 ? '+' : ''}{tempAdjustment[0].toFixed(1)}°C
                </span>
              </div>
              <Slider
                value={tempAdjustment}
                onValueChange={setTempAdjustment}
                min={-3}
                max={5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-3°C (Cooling)</span>
                <span>+5°C (Warming)</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Simulates global temperature deviation impact on local forecasts.
              {tempAdjustment[0] > 2 && ' ⚠️ Significant warming may increase drought and heat stress.'}
            </p>
          </TabsContent>

          <TabsContent value="rainfall" className="space-y-4 mt-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Rainfall Change</label>
                <span className="text-sm font-bold text-indigo-600">
                  {rainAdjustment[0] > 0 ? '+' : ''}{rainAdjustment[0]}%
                </span>
              </div>
              <Slider
                value={rainAdjustment}
                onValueChange={setRainAdjustment}
                min={-50}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-50% (Drought)</span>
                <span>+50% (Flood)</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Adjusts precipitation patterns to model drought or flood scenarios.
              {Math.abs(rainAdjustment[0]) > 30 && ' ⚠️ Extreme precipitation changes may impact agriculture.'}
            </p>
          </TabsContent>

          <TabsContent value="vegetation" className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vegetation health (NDVI) simulation based on temperature and rainfall adjustments.
              Apply temperature or rainfall scenarios to see vegetation impact.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleApply} className="flex-1">
            Apply Scenario
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioSimulator;
