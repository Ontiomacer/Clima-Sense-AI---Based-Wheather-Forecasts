import { useEffect, useRef } from 'react';

const Globe3D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Globe parameters
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    let rotation = 0;

    // Create gradient for 3D effect
    const createGradient = () => {
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(20, 100, 200, 0.1)');
      return gradient;
    };

    // Draw latitude lines
    const drawLatitudes = () => {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
      ctx.lineWidth = 1;

      for (let lat = -60; lat <= 60; lat += 20) {
        ctx.beginPath();
        const y = centerY + (lat / 90) * radius * 0.8;
        const width = Math.cos((lat * Math.PI) / 180) * radius;
        
        for (let i = 0; i <= 100; i++) {
          const angle = (i / 100) * Math.PI * 2 + rotation;
          const x = centerX + Math.cos(angle) * width;
          const z = Math.sin(angle) * width;
          
          if (z > 0) {
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    // Draw longitude lines
    const drawLongitudes = () => {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
      ctx.lineWidth = 1;

      for (let lon = 0; lon < 12; lon++) {
        ctx.beginPath();
        const baseAngle = (lon / 12) * Math.PI * 2 + rotation;
        
        for (let i = 0; i <= 100; i++) {
          const lat = ((i / 100) - 0.5) * Math.PI;
          const x = centerX + Math.cos(baseAngle) * Math.cos(lat) * radius;
          const y = centerY + Math.sin(lat) * radius;
          const z = Math.sin(baseAngle) * Math.cos(lat) * radius;
          
          if (z > -radius * 0.3) {
            const alpha = (z + radius * 0.3) / (radius * 1.3);
            ctx.globalAlpha = alpha * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.globalAlpha = 1;
        ctx.stroke();
      }
    };

    // Draw dots for continents (simplified)
    const drawContinents = () => {
      const dots = [
        // North America
        { lat: 40, lon: -100 }, { lat: 45, lon: -95 }, { lat: 35, lon: -105 },
        { lat: 50, lon: -100 }, { lat: 30, lon: -95 },
        // South America
        { lat: -10, lon: -60 }, { lat: -15, lon: -55 }, { lat: -20, lon: -50 },
        { lat: -5, lon: -65 }, { lat: -25, lon: -55 },
        // Europe
        { lat: 50, lon: 10 }, { lat: 45, lon: 15 }, { lat: 55, lon: 5 },
        { lat: 48, lon: 2 }, { lat: 52, lon: 20 },
        // Africa
        { lat: 0, lon: 20 }, { lat: -10, lon: 25 }, { lat: 10, lon: 15 },
        { lat: -20, lon: 30 }, { lat: 5, lon: 35 },
        // Asia
        { lat: 35, lon: 100 }, { lat: 40, lon: 110 }, { lat: 30, lon: 80 },
        { lat: 20, lon: 78 }, { lat: 45, lon: 90 }, { lat: 50, lon: 100 },
        // Australia
        { lat: -25, lon: 135 }, { lat: -30, lon: 140 }, { lat: -20, lon: 130 },
      ];

      dots.forEach(({ lat, lon }) => {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = ((lon * Math.PI) / 180) + rotation;
        
        const x = centerX + Math.cos(lonRad) * Math.cos(latRad) * radius;
        const y = centerY + Math.sin(latRad) * radius;
        const z = Math.sin(lonRad) * Math.cos(latRad) * radius;
        
        if (z > -radius * 0.2) {
          const alpha = (z + radius * 0.2) / (radius * 1.2);
          const size = 2 + alpha * 2;
          
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw globe sphere with gradient
      ctx.fillStyle = createGradient();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw grid and continents
      drawLatitudes();
      drawLongitudes();
      drawContinents();

      // Draw outer glow
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotate
      rotation += 0.002;

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default Globe3D;
