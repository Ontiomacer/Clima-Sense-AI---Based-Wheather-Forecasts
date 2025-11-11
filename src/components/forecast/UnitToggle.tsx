import { Button } from '@/components/ui/button';
import { Thermometer, Droplets } from 'lucide-react';

interface UnitToggleProps {
  tempUnit: 'C' | 'F';
  rainUnit: 'mm' | 'inch';
  onTempUnitChange: (unit: 'C' | 'F') => void;
  onRainUnitChange: (unit: 'mm' | 'inch') => void;
}

const UnitToggle = ({ tempUnit, rainUnit, onTempUnitChange, onRainUnitChange }: UnitToggleProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Thermometer className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Temperature:</span>
        <div className="flex rounded-md border border-border overflow-hidden">
          <Button
            variant={tempUnit === 'C' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTempUnitChange('C')}
            className="rounded-none px-3 h-8"
          >
            °C
          </Button>
          <Button
            variant={tempUnit === 'F' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTempUnitChange('F')}
            className="rounded-none px-3 h-8"
          >
            °F
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Rainfall:</span>
        <div className="flex rounded-md border border-border overflow-hidden">
          <Button
            variant={rainUnit === 'mm' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onRainUnitChange('mm')}
            className="rounded-none px-3 h-8"
          >
            mm
          </Button>
          <Button
            variant={rainUnit === 'inch' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onRainUnitChange('inch')}
            className="rounded-none px-3 h-8"
          >
            inch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnitToggle;
