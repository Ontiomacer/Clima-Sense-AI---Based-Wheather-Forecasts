import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Filter } from 'lucide-react';

interface FarmingFiltersProps {
  filters: {
    region: string;
    crop: string;
    season: string;
  };
  setFilters: (filters: any) => void;
  showAIAdvisory: boolean;
  setShowAIAdvisory: (show: boolean) => void;
  compareMode: boolean;
  setCompareMode: (compare: boolean) => void;
}

const FarmingFilters = ({
  filters,
  setFilters,
  showAIAdvisory,
  setShowAIAdvisory,
  compareMode,
  setCompareMode,
}: FarmingFiltersProps) => {
  const regions = [
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'uttar pradesh', label: 'Uttar Pradesh' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'tamil nadu', label: 'Tamil Nadu' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'west bengal', label: 'West Bengal' },
  ];

  const crops = [
    { value: 'rice', label: '🌾 Rice (Paddy)' },
    { value: 'wheat', label: '🌾 Wheat' },
    { value: 'maize', label: '🌽 Maize (Corn)' },
    { value: 'soybean', label: '🫘 Soybean' },
    { value: 'cotton', label: '🌱 Cotton' },
    { value: 'sugarcane', label: '🎋 Sugarcane' },
    { value: 'pulses', label: '🫘 Pulses' },
    { value: 'vegetables', label: '🥬 Vegetables' },
  ];

  const seasons = [
    { value: 'kharif', label: 'Kharif (Monsoon)' },
    { value: 'rabi', label: 'Rabi (Winter)' },
    { value: 'zaid', label: 'Zaid (Summer)' },
  ];

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filters & Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Region */}
          <div className="space-y-2">
            <Label>Region</Label>
            <Select
              value={filters.region}
              onValueChange={(value) => setFilters({ ...filters, region: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Crop Type */}
          <div className="space-y-2">
            <Label>Crop Type</Label>
            <Select
              value={filters.crop}
              onValueChange={(value) => setFilters({ ...filters, crop: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem key={crop.value} value={crop.value}>
                    {crop.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Season */}
          <div className="space-y-2">
            <Label>Season</Label>
            <Select
              value={filters.season}
              onValueChange={(value) => setFilters({ ...filters, season: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.value} value={season.value}>
                    {season.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="ai-advisory"
              checked={showAIAdvisory}
              onCheckedChange={setShowAIAdvisory}
            />
            <Label htmlFor="ai-advisory" className="cursor-pointer">
              Show AI Advisory
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="compare-mode"
              checked={compareMode}
              onCheckedChange={setCompareMode}
            />
            <Label htmlFor="compare-mode" className="cursor-pointer">
              Compare with Previous Season
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmingFilters;
