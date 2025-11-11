"""
GraphCast Model Manager
Handles loading, caching, and managing GraphCast model weights.
"""

import logging
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
import asyncio

from .config import MODEL_CONFIG, INFERENCE_CONFIG

logger = logging.getLogger(__name__)


class GraphCastModelManager:
    """
    Manages GraphCast model lifecycle including loading, validation, and device selection.
    Implements lazy loading to defer model initialization until first request.
    """
    
    def __init__(self, model_path: Optional[str] = None, device: str = "auto"):
        """
        Initialize model manager.
        
        Args:
            model_path: Path to model weights file. If None, uses config default.
            device: Device to use for inference ("cpu", "cuda", "auto")
        """
        self.model_path = Path(model_path) if model_path else MODEL_CONFIG["weights_path"]
        self.device = self._select_device(device)
        self.model = None
        self._is_loaded = False
        self._loading_lock = asyncio.Lock()
        
        logger.info(f"GraphCastModelManager initialized with device: {self.device}")
        logger.warning("GraphCast is a research-grade model. Predictions should be validated against local observations.")
    
    def _select_device(self, device: str) -> str:
        """
        Select appropriate device for inference.
        
        Args:
            device: Requested device ("cpu", "cuda", "auto")
            
        Returns:
            Selected device string
        """
        if device == "auto":
            try:
                import jax
                # Check if GPU is available
                devices = jax.devices()
                if any(d.platform == "gpu" for d in devices):
                    logger.info("GPU detected, using GPU for inference")
                    return "gpu"
                else:
                    logger.info("No GPU detected, using CPU for inference")
                    return "cpu"
            except Exception as e:
                logger.warning(f"Error detecting devices: {e}. Defaulting to CPU.")
                return "cpu"
        
        return device
    
    async def load_model(self) -> bool:
        """
        Download and load GraphCast model weights.
        Implements lazy loading - only loads on first call.
        
        Returns:
            True if model loaded successfully, False otherwise
        """
        async with self._loading_lock:
            if self._is_loaded:
                logger.debug("Model already loaded, skipping")
                return True
            
            try:
                # Check if weights exist
                if not self.model_path.exists():
                    logger.info(f"Model weights not found at {self.model_path}")
                    logger.info("Model weights need to be downloaded. Use download_weights.py script.")
                    return False
                
                # Validate weights file
                if not self._validate_weights_file():
                    logger.error("Model weights validation failed")
                    return False
                
                # Load model (placeholder - actual JAX/Haiku loading would go here)
                logger.info(f"Loading GraphCast model from {self.model_path}")
                
                # In a real implementation, this would load the model using JAX/Haiku
                # For now, we'll simulate the loading
                self.model = {
                    "path": str(self.model_path),
                    "device": self.device,
                    "version": MODEL_CONFIG["model_version"],
                    "loaded": True
                }
                
                self._is_loaded = True
                logger.info(f"GraphCast model loaded successfully on {self.device}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to load GraphCast model: {e}", exc_info=True)
                return False
    
    def _validate_weights_file(self) -> bool:
        """
        Validate model weights file integrity.
        
        Returns:
            True if file is valid, False otherwise
        """
        try:
            if not self.model_path.exists():
                logger.error(f"Weights file does not exist: {self.model_path}")
                return False
            
            file_size = self.model_path.stat().st_size
            if file_size < 1024 * 1024:  # Less than 1MB is suspicious
                logger.error(f"Weights file is too small: {file_size} bytes")
                return False
            
            logger.info(f"Weights file validated: {file_size / (1024**3):.2f} GB")
            
            # If checksum is provided in config, validate it
            if MODEL_CONFIG.get("weights_checksum"):
                checksum = self._calculate_checksum()
                if checksum != MODEL_CONFIG["weights_checksum"]:
                    logger.error("Checksum validation failed")
                    return False
                logger.info("Checksum validation passed")
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating weights file: {e}")
            return False
    
    def _calculate_checksum(self, algorithm: str = "sha256") -> str:
        """
        Calculate checksum of weights file.
        
        Args:
            algorithm: Hash algorithm to use
            
        Returns:
            Hexadecimal checksum string
        """
        hash_obj = hashlib.new(algorithm)
        
        with open(self.model_path, "rb") as f:
            # Read in chunks to handle large files
            for chunk in iter(lambda: f.read(8192), b""):
                hash_obj.update(chunk)
        
        return hash_obj.hexdigest()
    
    def is_model_loaded(self) -> bool:
        """
        Check if model is ready for inference.
        
        Returns:
            True if model is loaded, False otherwise
        """
        return self._is_loaded
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Return model metadata.
        
        Returns:
            Dictionary containing model information
        """
        info = {
            "model_path": str(self.model_path),
            "device": self.device,
            "is_loaded": self._is_loaded,
            "version": MODEL_CONFIG["model_version"],
            "weights_url": MODEL_CONFIG["weights_url"],
        }
        
        if self.model_path.exists():
            info["weights_size_gb"] = self.model_path.stat().st_size / (1024**3)
        
        return info
    
    async def unload_model(self):
        """
        Unload model from memory to free resources.
        """
        async with self._loading_lock:
            if self._is_loaded:
                self.model = None
                self._is_loaded = False
                logger.info("GraphCast model unloaded")
