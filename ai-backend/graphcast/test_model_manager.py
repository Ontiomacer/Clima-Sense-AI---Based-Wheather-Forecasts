"""
Unit tests for GraphCast Model Manager
Tests model loading, validation, and device selection.
"""

import pytest
import asyncio
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

from .model_manager import GraphCastModelManager
from .config import MODEL_CONFIG


class TestGraphCastModelManager:
    """Test suite for GraphCastModelManager"""
    
    @pytest.fixture
    def temp_weights_file(self):
        """Create a temporary weights file for testing"""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".npz") as f:
            # Write some dummy data (> 1MB to pass validation)
            f.write(b"0" * (2 * 1024 * 1024))  # 2MB
            temp_path = Path(f.name)
        
        yield temp_path
        
        # Cleanup
        if temp_path.exists():
            temp_path.unlink()
    
    @pytest.fixture
    def manager_with_temp_weights(self, temp_weights_file):
        """Create manager with temporary weights file"""
        return GraphCastModelManager(model_path=str(temp_weights_file), device="cpu")
    
    def test_initialization(self):
        """Test model manager initialization"""
        manager = GraphCastModelManager(device="cpu")
        
        assert manager.device == "cpu"
        assert manager.model is None
        assert not manager.is_model_loaded()
        assert manager.model_path == MODEL_CONFIG["weights_path"]
    
    def test_device_selection_cpu(self):
        """Test CPU device selection"""
        manager = GraphCastModelManager(device="cpu")
        assert manager.device == "cpu"
    
    def test_device_selection_auto_no_gpu(self):
        """Test auto device selection when no GPU available"""
        with patch('jax.devices', return_value=[Mock(platform="cpu")]):
            manager = GraphCastModelManager(device="auto")
            assert manager.device == "cpu"
    
    def test_device_selection_auto_with_gpu(self):
        """Test auto device selection when GPU available"""
        with patch('jax.devices', return_value=[Mock(platform="gpu")]):
            manager = GraphCastModelManager(device="auto")
            assert manager.device == "gpu"
    
    def test_device_selection_auto_fallback(self):
        """Test auto device selection falls back to CPU on error"""
        with patch('jax.devices', side_effect=Exception("JAX not available")):
            manager = GraphCastModelManager(device="auto")
            assert manager.device == "cpu"
    
    @pytest.mark.asyncio
    async def test_load_model_missing_weights(self):
        """Test model loading fails when weights file is missing"""
        manager = GraphCastModelManager(model_path="/nonexistent/path.npz", device="cpu")
        
        result = await manager.load_model()
        
        assert result is False
        assert not manager.is_model_loaded()
    
    @pytest.mark.asyncio
    async def test_load_model_success(self, manager_with_temp_weights):
        """Test successful model loading with valid weights file"""
        result = await manager_with_temp_weights.load_model()
        
        assert result is True
        assert manager_with_temp_weights.is_model_loaded()
        assert manager_with_temp_weights.model is not None
    
    @pytest.mark.asyncio
    async def test_load_model_idempotent(self, manager_with_temp_weights):
        """Test that loading model multiple times is idempotent"""
        result1 = await manager_with_temp_weights.load_model()
        result2 = await manager_with_temp_weights.load_model()
        
        assert result1 is True
        assert result2 is True
        assert manager_with_temp_weights.is_model_loaded()
    
    def test_validate_weights_file_missing(self):
        """Test validation fails for missing weights file"""
        manager = GraphCastModelManager(model_path="/nonexistent/path.npz", device="cpu")
        
        result = manager._validate_weights_file()
        
        assert result is False
    
    def test_validate_weights_file_too_small(self):
        """Test validation fails for suspiciously small file"""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".npz") as f:
            f.write(b"small")  # Less than 1MB
            temp_path = Path(f.name)
        
        try:
            manager = GraphCastModelManager(model_path=str(temp_path), device="cpu")
            result = manager._validate_weights_file()
            assert result is False
        finally:
            temp_path.unlink()
    
    def test_validate_weights_file_success(self, manager_with_temp_weights):
        """Test successful validation of valid weights file"""
        result = manager_with_temp_weights._validate_weights_file()
        assert result is True
    
    def test_calculate_checksum(self, temp_weights_file):
        """Test checksum calculation"""
        manager = GraphCastModelManager(model_path=str(temp_weights_file), device="cpu")
        
        checksum = manager._calculate_checksum()
        
        assert isinstance(checksum, str)
        assert len(checksum) == 64  # SHA256 produces 64 hex characters
    
    def test_get_model_info_not_loaded(self):
        """Test getting model info when model is not loaded"""
        manager = GraphCastModelManager(device="cpu")
        
        info = manager.get_model_info()
        
        assert info["device"] == "cpu"
        assert info["is_loaded"] is False
        assert info["version"] == MODEL_CONFIG["model_version"]
    
    def test_get_model_info_with_weights(self, manager_with_temp_weights):
        """Test getting model info when weights file exists"""
        info = manager_with_temp_weights.get_model_info()
        
        assert "weights_size_gb" in info
        assert info["weights_size_gb"] > 0
    
    @pytest.mark.asyncio
    async def test_unload_model(self, manager_with_temp_weights):
        """Test model unloading"""
        # Load model first
        await manager_with_temp_weights.load_model()
        assert manager_with_temp_weights.is_model_loaded()
        
        # Unload
        await manager_with_temp_weights.unload_model()
        
        assert not manager_with_temp_weights.is_model_loaded()
        assert manager_with_temp_weights.model is None
    
    @pytest.mark.asyncio
    async def test_concurrent_loading(self, manager_with_temp_weights):
        """Test that concurrent load attempts are handled correctly"""
        # Attempt to load model concurrently
        results = await asyncio.gather(
            manager_with_temp_weights.load_model(),
            manager_with_temp_weights.load_model(),
            manager_with_temp_weights.load_model()
        )
        
        # All should succeed
        assert all(results)
        assert manager_with_temp_weights.is_model_loaded()


class TestModelManagerEdgeCases:
    """Test edge cases and error handling"""
    
    def test_corrupted_weights_checksum_mismatch(self):
        """Test handling of corrupted weights with checksum mismatch"""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".npz") as f:
            f.write(b"0" * (2 * 1024 * 1024))
            temp_path = Path(f.name)
        
        try:
            # Patch config to include a wrong checksum
            with patch.dict(MODEL_CONFIG, {"weights_checksum": "wrong_checksum"}):
                manager = GraphCastModelManager(model_path=str(temp_path), device="cpu")
                result = manager._validate_weights_file()
                assert result is False
        finally:
            temp_path.unlink()
    
    @pytest.mark.asyncio
    async def test_load_model_exception_handling(self):
        """Test that exceptions during loading are handled gracefully"""
        manager = GraphCastModelManager(device="cpu")
        
        # Mock _validate_weights_file to raise an exception
        with patch.object(manager, '_validate_weights_file', side_effect=Exception("Test error")):
            result = await manager.load_model()
            
            assert result is False
            assert not manager.is_model_loaded()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
