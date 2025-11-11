"""
GraphCast Model Weights Download Utility
Downloads and validates GraphCast model weights from DeepMind repository.
"""

import sys
import hashlib
import logging
from pathlib import Path
from typing import Optional
import requests
from tqdm import tqdm

from .config import MODEL_CONFIG, MODELS_DIR

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WeightsDownloader:
    """
    Handles downloading and validation of GraphCast model weights.
    """
    
    def __init__(
        self,
        url: Optional[str] = None,
        output_path: Optional[Path] = None,
        checksum: Optional[str] = None
    ):
        """
        Initialize weights downloader.
        
        Args:
            url: URL to download weights from. If None, uses config default.
            output_path: Path to save weights. If None, uses config default.
            checksum: Expected SHA256 checksum. If None, skips validation.
        """
        self.url = url or MODEL_CONFIG["weights_url"]
        self.output_path = output_path or MODEL_CONFIG["weights_path"]
        self.checksum = checksum or MODEL_CONFIG.get("weights_checksum")
        
        # Ensure output directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
    
    def download(self, force: bool = False) -> bool:
        """
        Download model weights with progress bar.
        
        Args:
            force: If True, download even if file exists
            
        Returns:
            True if download successful, False otherwise
        """
        # Check if file already exists
        if self.output_path.exists() and not force:
            logger.info(f"Weights file already exists at {self.output_path}")
            if self.validate_checksum():
                logger.info("Existing file is valid")
                return True
            else:
                logger.warning("Existing file failed validation, re-downloading")
        
        try:
            logger.info(f"Downloading GraphCast weights from {self.url}")
            logger.info(f"Saving to {self.output_path}")
            
            # Stream download with progress bar
            response = requests.get(self.url, stream=True, timeout=30)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(self.output_path, 'wb') as f, tqdm(
                desc="Downloading",
                total=total_size,
                unit='B',
                unit_scale=True,
                unit_divisor=1024,
            ) as progress_bar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        progress_bar.update(len(chunk))
            
            logger.info(f"Download completed: {self.output_path}")
            
            # Validate downloaded file
            if self.checksum:
                if not self.validate_checksum():
                    logger.error("Downloaded file failed checksum validation")
                    self.output_path.unlink()  # Delete invalid file
                    return False
                logger.info("Checksum validation passed")
            
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Download failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during download: {e}", exc_info=True)
            return False
    
    def validate_checksum(self, algorithm: str = "sha256") -> bool:
        """
        Validate file checksum.
        
        Args:
            algorithm: Hash algorithm to use
            
        Returns:
            True if checksum matches or no checksum provided, False otherwise
        """
        if not self.checksum:
            logger.debug("No checksum provided, skipping validation")
            return True
        
        if not self.output_path.exists():
            logger.error(f"File does not exist: {self.output_path}")
            return False
        
        try:
            logger.info("Calculating file checksum...")
            calculated = self._calculate_checksum(algorithm)
            
            if calculated.lower() == self.checksum.lower():
                logger.info("Checksum validation successful")
                return True
            else:
                logger.error(f"Checksum mismatch!")
                logger.error(f"Expected: {self.checksum}")
                logger.error(f"Got: {calculated}")
                return False
                
        except Exception as e:
            logger.error(f"Error validating checksum: {e}")
            return False
    
    def _calculate_checksum(self, algorithm: str = "sha256") -> str:
        """
        Calculate file checksum.
        
        Args:
            algorithm: Hash algorithm to use
            
        Returns:
            Hexadecimal checksum string
        """
        hash_obj = hashlib.new(algorithm)
        
        with open(self.output_path, "rb") as f:
            # Read in chunks to handle large files
            for chunk in iter(lambda: f.read(8192), b""):
                hash_obj.update(chunk)
        
        return hash_obj.hexdigest()
    
    def get_file_info(self) -> dict:
        """
        Get information about the weights file.
        
        Returns:
            Dictionary with file information
        """
        if not self.output_path.exists():
            return {"exists": False}
        
        stat = self.output_path.stat()
        return {
            "exists": True,
            "path": str(self.output_path),
            "size_bytes": stat.st_size,
            "size_gb": stat.st_size / (1024**3),
            "modified": stat.st_mtime,
        }


def main():
    """
    Command-line interface for downloading weights.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Download GraphCast model weights"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force download even if file exists"
    )
    parser.add_argument(
        "--url",
        type=str,
        help="Custom download URL"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Custom output path"
    )
    
    args = parser.parse_args()
    
    # Create downloader
    downloader = WeightsDownloader(
        url=args.url,
        output_path=Path(args.output) if args.output else None
    )
    
    # Show file info if exists
    info = downloader.get_file_info()
    if info["exists"] and not args.force:
        logger.info(f"File already exists: {info['path']}")
        logger.info(f"Size: {info['size_gb']:.2f} GB")
        logger.info("Use --force to re-download")
        return 0
    
    # Download
    success = downloader.download(force=args.force)
    
    if success:
        info = downloader.get_file_info()
        logger.info("=" * 60)
        logger.info("Download successful!")
        logger.info(f"Path: {info['path']}")
        logger.info(f"Size: {info['size_gb']:.2f} GB")
        logger.info("=" * 60)
        return 0
    else:
        logger.error("Download failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
