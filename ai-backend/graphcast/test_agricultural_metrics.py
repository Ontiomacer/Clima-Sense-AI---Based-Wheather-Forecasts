"""
Unit tests for Agricultural Metrics Calculator
Tests rainfall risk, temperature extreme risk, soil moisture proxy, and confidence calculations.
"""

import unittest
from datetime import datetime, timedelta
import numpy as np
from .agricultural_metrics import (
    AgriculturalMetricsCalculator,
    RainfallRisk,
    TempExtremeRisk,
    SoilMoistureProxy
)


class TestAgriculturalMetricsCalculator(unittest.TestCase):
    """Test suite for AgriculturalMetricsCalculator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.calculator = AgriculturalMetricsCalculator()
        self.base_date = datetime(2024, 6, 1)
        self.dates = [self.base_date + timedelta(days=i) for i in range(10)]
    
    # ========== Rainfall Risk Tests ==========
    
    def test_rainfall_risk_low_precipitation(self):
        """Test rainfall risk with low precipitation values (< 5mm/day)."""
        # Low precipitation: 2mm/day for 10 days
        precipitation = np.array([2.0] * 10)
        
        risks = self.calculator.calculate_rainfall_risk(precipitation, self.dates)
        
        self.assertEqual(len(risks), 10)
        for risk in risks:
            self.assertIsInstance(risk, RainfallRisk)
            self.assertEqual(risk.risk_level, "low")
            self.assertLess(risk.risk_score, 30.0)
            self.assertEqual(risk.daily_precipitation_mm, 2.0)
    
    def test_rainfall_risk_moderate_precipitation(self):
        """Test rainfall risk with moderate precipitation values (5-25mm/day)."""
        # Moderate precipitation: 15mm/day
        precipitation = np.array([15.0] * 10)
        
        risks = self.calculator.calculate_rainfall_risk(precipitation, self.dates)
        
        for risk in risks:
            # Risk score should be in low-moderate range for 15mm/day
            self.assertGreater(risk.risk_score, 0.0)
            self.assertLess(risk.risk_score, 60.0)
            self.assertEqual(risk.daily_precipitation_mm, 15.0)
    
    def test_rainfall_risk_high_precipitation(self):
        """Test rainfall risk with high precipitation values (> 25mm/day)."""
        # High precipitation: 50mm/day
        precipitation = np.array([50.0] * 10)
        
        risks = self.calculator.calculate_rainfall_risk(precipitation, self.dates)
        
        for risk in risks:
            # Risk score should be elevated for 50mm/day
            self.assertGreater(risk.risk_score, 30.0)
            self.assertEqual(risk.daily_precipitation_mm, 50.0)
            # Later days should have higher cumulative risk
            if risks.index(risk) >= 6:
                self.assertGreater(risk.cumulative_7day_mm, 300.0)
    
    def test_rainfall_risk_cumulative_calculation(self):
        """Test 7-day cumulative precipitation calculation."""
        # Increasing precipitation over 10 days
        precipitation = np.array([5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0])
        
        risks = self.calculator.calculate_rainfall_risk(precipitation, self.dates)
        
        # Day 1: cumulative = 5mm
        self.assertEqual(risks[0].cumulative_7day_mm, 5.0)
        
        # Day 7: cumulative = sum of first 7 days = 140mm
        self.assertEqual(risks[6].cumulative_7day_mm, 140.0)
        
        # Day 10: cumulative = sum of days 4-10 (7 days) = 245mm
        self.assertEqual(risks[9].cumulative_7day_mm, 245.0)
    
    def test_rainfall_risk_flash_flood_intensity(self):
        """Test rainfall intensity calculation for flash flood risk."""
        # High intensity: 240mm in 24 hours = 10mm/hour (flash flood threshold)
        precipitation = np.array([240.0])
        dates = [self.base_date]
        
        risks = self.calculator.calculate_rainfall_risk(precipitation, dates, hours_per_timestep=24.0)
        
        self.assertEqual(risks[0].intensity_mm_per_hour, 10.0)
        self.assertEqual(risks[0].risk_level, "high")
        self.assertGreater(risks[0].risk_score, 60.0)
    
    def test_rainfall_risk_zero_precipitation(self):
        """Test rainfall risk with zero precipitation."""
        precipitation = np.array([0.0] * 10)
        
        risks = self.calculator.calculate_rainfall_risk(precipitation, self.dates)
        
        for risk in risks:
            self.assertEqual(risk.risk_score, 0.0)
            self.assertEqual(risk.risk_level, "low")
            self.assertEqual(risk.daily_precipitation_mm, 0.0)
            self.assertEqual(risk.intensity_mm_per_hour, 0.0)
    
    # ========== Temperature Extreme Risk Tests ==========
    
    def test_temperature_extreme_risk_optimal_range(self):
        """Test temperature risk within optimal range (no risk)."""
        # Optimal range for default crop: 20-30°C
        temp_max = np.array([28.0] * 10)
        temp_min = np.array([22.0] * 10)
        
        risks = self.calculator.calculate_temperature_extreme_risk(temp_max, temp_min, self.dates)
        
        for risk in risks:
            self.assertIsInstance(risk, TempExtremeRisk)
            self.assertEqual(risk.risk_level, "low")
            self.assertLess(risk.risk_score, 30.0)
            self.assertEqual(risk.temp_max_c, 28.0)
            self.assertEqual(risk.temp_min_c, 22.0)
    
    def test_temperature_extreme_risk_extreme_heat(self):
        """Test temperature risk with extreme heat (> 40°C)."""
        # Extreme heat: 45°C max
        temp_max = np.array([45.0] * 10)
        temp_min = np.array([30.0] * 10)
        
        risks = self.calculator.calculate_temperature_extreme_risk(temp_max, temp_min, self.dates)
        
        for risk in risks:
            self.assertEqual(risk.risk_level, "high")
            self.assertGreater(risk.risk_score, 60.0)
            self.assertEqual(risk.temp_max_c, 45.0)
    
    def test_temperature_extreme_risk_extreme_cold(self):
        """Test temperature risk with extreme cold (< 10°C)."""
        # Extreme cold: 5°C min
        temp_max = np.array([15.0] * 10)
        temp_min = np.array([5.0] * 10)
        
        risks = self.calculator.calculate_temperature_extreme_risk(temp_max, temp_min, self.dates)
        
        for risk in risks:
            self.assertEqual(risk.risk_level, "high")
            self.assertGreater(risk.risk_score, 60.0)
            self.assertEqual(risk.temp_min_c, 5.0)
    
    def test_temperature_extreme_risk_crop_specific_rice(self):
        """Test temperature risk for rice crop (optimal: 25-35°C)."""
        # Temperature slightly above optimal for rice
        temp_max = np.array([38.0] * 10)
        temp_min = np.array([26.0] * 10)
        
        risks = self.calculator.calculate_temperature_extreme_risk(
            temp_max, temp_min, self.dates, crop="rice"
        )
        
        for risk in risks:
            self.assertEqual(risk.optimal_min_c, 25.0)
            self.assertEqual(risk.optimal_max_c, 35.0)
            # 38°C is 3°C above optimal, should be low-moderate risk
            self.assertLess(risk.risk_score, 60.0)
    
    def test_temperature_extreme_risk_crop_specific_wheat(self):
        """Test temperature risk for wheat crop (optimal: 15-25°C)."""
        # Temperature above optimal for wheat
        temp_max = np.array([32.0] * 10)
        temp_min = np.array([18.0] * 10)
        
        risks = self.calculator.calculate_temperature_extreme_risk(
            temp_max, temp_min, self.dates, crop="wheat"
        )
        
        for risk in risks:
            self.assertEqual(risk.optimal_min_c, 15.0)
            self.assertEqual(risk.optimal_max_c, 25.0)
            # 32°C is 7°C above optimal, should show some risk
            self.assertGreater(risk.risk_score, 0.0)
            # Verify temperature deviation is captured
            self.assertEqual(risk.temp_max_c, 32.0)
    
    def test_temperature_extreme_risk_growth_stage_weight(self):
        """Test temperature risk with growth stage weighting."""
        temp_max = np.array([35.0] * 10)
        temp_min = np.array([20.0] * 10)
        
        # Normal risk
        risks_normal = self.calculator.calculate_temperature_extreme_risk(
            temp_max, temp_min, self.dates, growth_stage_weight=1.0
        )
        
        # Critical growth stage (2x weight)
        risks_critical = self.calculator.calculate_temperature_extreme_risk(
            temp_max, temp_min, self.dates, growth_stage_weight=2.0
        )
        
        # Risk should be higher with growth stage weighting
        self.assertGreater(risks_critical[0].risk_score, risks_normal[0].risk_score)
    
    def test_temperature_extreme_risk_both_extremes(self):
        """Test temperature risk with both extreme heat and cold."""
        # Extreme heat max, extreme cold min
        temp_max = np.array([42.0])
        temp_min = np.array([8.0])
        dates = [self.base_date]
        
        risks = self.calculator.calculate_temperature_extreme_risk(temp_max, temp_min, dates)
        
        # Should have very high risk due to both extremes
        self.assertEqual(risks[0].risk_level, "high")
        self.assertGreater(risks[0].risk_score, 80.0)
    
    # ========== Soil Moisture Proxy Tests ==========
    
    def test_soil_moisture_proxy_steady_state(self):
        """Test soil moisture with balanced precipitation and ET."""
        # Balanced: 5mm precip, ~25°C temp, 60% humidity
        precipitation = np.array([5.0] * 10)
        temperature = np.array([25.0] * 10)
        humidity = np.array([60.0] * 10)
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, self.dates
        )
        
        self.assertEqual(len(proxies), 10)
        for proxy in proxies:
            self.assertIsInstance(proxy, SoilMoistureProxy)
            # Should remain relatively stable
            self.assertGreater(proxy.moisture_percent, 30.0)
            self.assertLess(proxy.moisture_percent, 80.0)
    
    def test_soil_moisture_proxy_drying_trend(self):
        """Test soil moisture with drying conditions (low precip, high temp)."""
        # Drying: 0mm precip, 35°C temp, 30% humidity
        precipitation = np.array([0.0] * 10)
        temperature = np.array([35.0] * 10)
        humidity = np.array([30.0] * 10)
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, self.dates, initial_moisture=60.0
        )
        
        # Moisture should decrease over time
        self.assertGreater(proxies[0].moisture_percent, proxies[-1].moisture_percent)
        
        # Later days should show "dry" level
        self.assertEqual(proxies[-1].moisture_level, "dry")
        self.assertLess(proxies[-1].moisture_percent, 30.0)
    
    def test_soil_moisture_proxy_wetting_trend(self):
        """Test soil moisture with wetting conditions (high precip, low temp)."""
        # Wetting: 20mm precip, 20°C temp, 80% humidity
        precipitation = np.array([20.0] * 10)
        temperature = np.array([20.0] * 10)
        humidity = np.array([80.0] * 10)
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, self.dates, initial_moisture=40.0
        )
        
        # Moisture should increase over time
        self.assertLess(proxies[0].moisture_percent, proxies[-1].moisture_percent)
        
        # Later days should show "saturated" level
        self.assertEqual(proxies[-1].moisture_level, "saturated")
        self.assertGreater(proxies[-1].moisture_percent, 80.0)
    
    def test_soil_moisture_proxy_field_capacity_constraint(self):
        """Test soil moisture respects field capacity constraint (100%)."""
        # Very high precipitation
        precipitation = np.array([100.0] * 10)
        temperature = np.array([20.0] * 10)
        humidity = np.array([90.0] * 10)
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, self.dates
        )
        
        # Should not exceed field capacity
        for proxy in proxies:
            self.assertLessEqual(proxy.moisture_percent, 100.0)
            # Drainage should occur when at capacity
            if proxy.moisture_percent >= 100.0:
                self.assertGreater(proxy.drainage_mm, 0.0)
    
    def test_soil_moisture_proxy_wilting_point_constraint(self):
        """Test soil moisture respects wilting point constraint (0%)."""
        # No precipitation, extreme heat
        precipitation = np.array([0.0] * 20)
        temperature = np.array([40.0] * 20)
        humidity = np.array([20.0] * 20)
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, 
            [self.base_date + timedelta(days=i) for i in range(20)],
            initial_moisture=20.0
        )
        
        # Should not go below wilting point
        for proxy in proxies:
            self.assertGreaterEqual(proxy.moisture_percent, 0.0)
    
    def test_soil_moisture_proxy_evapotranspiration_calculation(self):
        """Test evapotranspiration calculation from temperature and humidity."""
        # Reference conditions: 25°C, 60% humidity
        precipitation = np.array([0.0])
        temperature = np.array([25.0])
        humidity = np.array([60.0])
        dates = [self.base_date]
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, dates
        )
        
        # ET should be positive and reasonable at 25°C
        self.assertGreater(proxies[0].evapotranspiration_mm, 0.0)
        self.assertLess(proxies[0].evapotranspiration_mm, 10.0)
        
        # Higher temperature should increase ET
        temperature_high = np.array([35.0])
        proxies_high = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature_high, humidity, dates, initial_moisture=50.0
        )
        
        self.assertGreater(proxies_high[0].evapotranspiration_mm, proxies[0].evapotranspiration_mm)
    
    def test_soil_moisture_proxy_drainage_calculation(self):
        """Test drainage calculation when soil exceeds field capacity."""
        # Heavy rain to exceed field capacity
        precipitation = np.array([80.0])
        temperature = np.array([25.0])
        humidity = np.array([70.0])
        dates = [self.base_date]
        
        proxies = self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, dates, initial_moisture=80.0
        )
        
        # Should have drainage due to excess water
        self.assertGreater(proxies[0].drainage_mm, 0.0)
        self.assertEqual(proxies[0].moisture_percent, 100.0)
    
    def test_soil_moisture_proxy_reset(self):
        """Test soil moisture state reset functionality."""
        # Run calculation to change state
        precipitation = np.array([20.0] * 5)
        temperature = np.array([25.0] * 5)
        humidity = np.array([60.0] * 5)
        dates = self.dates[:5]
        
        self.calculator.calculate_soil_moisture_proxy(
            precipitation, temperature, humidity, dates, initial_moisture=30.0
        )
        
        # State should have changed
        self.assertNotEqual(self.calculator.soil_moisture_state, 30.0)
        
        # Reset to default
        self.calculator.reset_soil_moisture()
        self.assertEqual(self.calculator.soil_moisture_state, 50.0)
        
        # Reset to custom value
        self.calculator.reset_soil_moisture(initial_moisture=70.0)
        self.assertEqual(self.calculator.soil_moisture_state, 70.0)
    
    # ========== Confidence Score Tests ==========
    
    def test_confidence_score_decreases_with_forecast_horizon(self):
        """Test that confidence scores decrease with forecast day."""
        confidence_day1 = self.calculator.calculate_confidence_score(forecast_day=1)
        confidence_day5 = self.calculator.calculate_confidence_score(forecast_day=5)
        confidence_day10 = self.calculator.calculate_confidence_score(forecast_day=10)
        
        # Confidence should decrease with forecast horizon
        self.assertGreater(confidence_day1, confidence_day5)
        self.assertGreater(confidence_day5, confidence_day10)
        
        # Day 1 should be close to base confidence (0.95)
        self.assertAlmostEqual(confidence_day1, 0.95, delta=0.01)
        
        # All should be within valid range
        self.assertGreaterEqual(confidence_day1, 0.0)
        self.assertLessEqual(confidence_day1, 1.0)
        self.assertGreaterEqual(confidence_day10, 0.0)
        self.assertLessEqual(confidence_day10, 1.0)
    
    def test_confidence_score_minimum_threshold(self):
        """Test that confidence score respects minimum threshold."""
        # Very far forecast day
        confidence_day100 = self.calculator.calculate_confidence_score(forecast_day=100)
        
        # Should not go below minimum confidence (0.5)
        self.assertGreaterEqual(confidence_day100, 0.5)
        self.assertEqual(confidence_day100, 0.5)
    
    def test_confidence_score_with_model_uncertainty(self):
        """Test confidence score adjustment with model uncertainty."""
        # No uncertainty
        confidence_no_uncertainty = self.calculator.calculate_confidence_score(
            forecast_day=3, model_uncertainty=0.0
        )
        
        # High uncertainty
        confidence_high_uncertainty = self.calculator.calculate_confidence_score(
            forecast_day=3, model_uncertainty=0.5
        )
        
        # Confidence should be lower with higher uncertainty
        self.assertGreater(confidence_no_uncertainty, confidence_high_uncertainty)
        
        # With 50% uncertainty, confidence should be roughly halved
        self.assertAlmostEqual(
            confidence_high_uncertainty, 
            confidence_no_uncertainty * 0.5, 
            delta=0.05
        )
    
    def test_confidence_score_exponential_decay(self):
        """Test that confidence follows exponential decay pattern."""
        confidences = [
            self.calculator.calculate_confidence_score(forecast_day=i)
            for i in range(1, 11)
        ]
        
        # Calculate decay ratios
        decay_ratios = [
            confidences[i] / confidences[i-1]
            for i in range(1, len(confidences))
        ]
        
        # Decay ratios should be relatively consistent (exponential decay)
        # Allow some variation due to minimum threshold
        for i in range(len(decay_ratios) - 1):
            if confidences[i+1] > 0.5:  # Not at minimum threshold
                self.assertAlmostEqual(decay_ratios[i], decay_ratios[i+1], delta=0.05)


if __name__ == "__main__":
    unittest.main()