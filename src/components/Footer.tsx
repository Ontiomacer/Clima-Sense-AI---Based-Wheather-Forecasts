import { Satellite } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center font-bold text-primary">
              CS
            </div>
            <div>
              <div className="font-bold text-lg">ClimaSense</div>
              <div className="text-sm text-primary-foreground/80">Intelligence for a Sustainable Planet</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-sm">
              <Satellite className="w-4 h-4" />
              <span>Powered by Google Earth Engine, CHIRPS, and OpenWeather APIs</span>
            </div>
            <div className="text-xs text-primary-foreground/60">
              © {new Date().getFullYear()} ClimaSense. All rights reserved.
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-4 text-sm">
              <a href="#about" className="hover:text-accent transition-colors">
                About
              </a>
              <a href="#contact" className="hover:text-accent transition-colors">
                Contact
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
