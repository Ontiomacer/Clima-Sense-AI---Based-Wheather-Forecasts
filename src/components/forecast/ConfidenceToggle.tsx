import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfidenceToggleProps {
  showConfidence: boolean;
  onToggle: (show: boolean) => void;
}

const ConfidenceToggle = ({ showConfidence, onToggle }: ConfidenceToggleProps) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Switch
        id="confidence-toggle"
        checked={showConfidence}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="confidence-toggle" className="cursor-pointer">
        Show Confidence Intervals
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              Shaded region represents a 95% confidence interval. 
              Wider bands indicate greater uncertainty in the forecast.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ConfidenceToggle;
