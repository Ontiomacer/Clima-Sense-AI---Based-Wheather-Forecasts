"""
Performance Profiler for GraphCast Backend
Provides profiling utilities to measure and optimize function execution times.
"""

import time
import functools
import logging
from typing import Callable, Any, Dict, Optional
from collections import defaultdict
import cProfile
import pstats
import io
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class PerformanceProfiler:
    """
    Performance profiler for tracking function execution times and bottlenecks.
    """
    
    def __init__(self):
        """Initialize profiler with empty metrics."""
        self.metrics = defaultdict(lambda: {
            'count': 0,
            'total_time_ms': 0.0,
            'min_time_ms': float('inf'),
            'max_time_ms': 0.0,
            'avg_time_ms': 0.0
        })
        self.enabled = True
    
    def profile_function(self, func_name: Optional[str] = None) -> Callable:
        """
        Decorator to profile function execution time.
        
        Args:
            func_name: Optional custom name for the function
            
        Returns:
            Decorated function
            
        Example:
            @profiler.profile_function("my_function")
            def my_function():
                pass
        """
        def decorator(func: Callable) -> Callable:
            name = func_name or f"{func.__module__}.{func.__name__}"
            
            @functools.wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                if not self.enabled:
                    return func(*args, **kwargs)
                
                start_time = time.perf_counter()
                try:
                    result = func(*args, **kwargs)
                    return result
                finally:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000
                    self._record_metric(name, elapsed_ms)
            
            return wrapper
        return decorator
    
    @contextmanager
    def profile_block(self, block_name: str):
        """
        Context manager to profile a code block.
        
        Args:
            block_name: Name for the profiled block
            
        Example:
            with profiler.profile_block("data_processing"):
                # code to profile
                pass
        """
        if not self.enabled:
            yield
            return
        
        start_time = time.perf_counter()
        try:
            yield
        finally:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            self._record_metric(block_name, elapsed_ms)
    
    def _record_metric(self, name: str, elapsed_ms: float):
        """
        Record execution time metric.
        
        Args:
            name: Function or block name
            elapsed_ms: Elapsed time in milliseconds
        """
        metric = self.metrics[name]
        metric['count'] += 1
        metric['total_time_ms'] += elapsed_ms
        metric['min_time_ms'] = min(metric['min_time_ms'], elapsed_ms)
        metric['max_time_ms'] = max(metric['max_time_ms'], elapsed_ms)
        metric['avg_time_ms'] = metric['total_time_ms'] / metric['count']
    
    def get_metrics(self) -> Dict[str, Dict[str, float]]:
        """
        Get all recorded metrics.
        
        Returns:
            Dictionary of metrics by function/block name
        """
        return dict(self.metrics)
    
    def get_sorted_metrics(self, sort_by: str = 'total_time_ms', limit: int = 10) -> list:
        """
        Get metrics sorted by specified field.
        
        Args:
            sort_by: Field to sort by (total_time_ms, avg_time_ms, count, max_time_ms)
            limit: Maximum number of results to return
            
        Returns:
            List of (name, metrics) tuples sorted by specified field
        """
        items = list(self.metrics.items())
        items.sort(key=lambda x: x[1][sort_by], reverse=True)
        return items[:limit]
    
    def print_report(self, sort_by: str = 'total_time_ms', limit: int = 10):
        """
        Print performance report to logger.
        
        Args:
            sort_by: Field to sort by
            limit: Maximum number of results to show
        """
        logger.info("=" * 80)
        logger.info("PERFORMANCE PROFILING REPORT")
        logger.info("=" * 80)
        
        sorted_metrics = self.get_sorted_metrics(sort_by, limit)
        
        if not sorted_metrics:
            logger.info("No metrics recorded")
            return
        
        logger.info(f"{'Function/Block':<50} {'Count':>8} {'Total(ms)':>12} {'Avg(ms)':>10} {'Min(ms)':>10} {'Max(ms)':>10}")
        logger.info("-" * 80)
        
        for name, metrics in sorted_metrics:
            logger.info(
                f"{name:<50} {metrics['count']:>8} "
                f"{metrics['total_time_ms']:>12.2f} "
                f"{metrics['avg_time_ms']:>10.2f} "
                f"{metrics['min_time_ms']:>10.2f} "
                f"{metrics['max_time_ms']:>10.2f}"
            )
        
        logger.info("=" * 80)
    
    def reset(self):
        """Reset all metrics."""
        self.metrics.clear()
    
    def enable(self):
        """Enable profiling."""
        self.enabled = True
    
    def disable(self):
        """Disable profiling."""
        self.enabled = False


def profile_with_cprofile(func: Callable) -> Callable:
    """
    Decorator to profile function with cProfile and print detailed stats.
    
    This provides more detailed profiling than the simple timer,
    including call counts and time spent in sub-functions.
    
    Args:
        func: Function to profile
        
    Returns:
        Decorated function
        
    Example:
        @profile_with_cprofile
        def expensive_function():
            pass
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            profiler.disable()
            
            # Print stats
            s = io.StringIO()
            ps = pstats.Stats(profiler, stream=s)
            ps.strip_dirs()
            ps.sort_stats('cumulative')
            ps.print_stats(20)  # Top 20 functions
            
            logger.info(f"\n{'='*80}\ncProfile Report for {func.__name__}\n{'='*80}\n{s.getvalue()}")
    
    return wrapper


# Global profiler instance
profiler = PerformanceProfiler()


def get_profiler() -> PerformanceProfiler:
    """
    Get the global profiler instance.
    
    Returns:
        Global PerformanceProfiler instance
    """
    return profiler
