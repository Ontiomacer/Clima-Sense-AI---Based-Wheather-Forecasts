"""
Request Queue Manager for GraphCast Inference
Manages concurrent inference requests to prevent memory exhaustion and optimize throughput.
"""

import asyncio
import time
import logging
from typing import Optional, Callable, Any, Dict
from dataclasses import dataclass
from enum import Enum
from collections import deque

logger = logging.getLogger(__name__)


class RequestPriority(Enum):
    """Priority levels for inference requests."""
    HIGH = 1  # Cached requests or high-priority users
    NORMAL = 2  # Standard requests
    LOW = 3  # Background pre-computation


@dataclass
class QueuedRequest:
    """Represents a queued inference request."""
    request_id: str
    priority: RequestPriority
    task: Callable
    args: tuple
    kwargs: dict
    queued_at: float
    future: asyncio.Future
    
    def __lt__(self, other):
        """Compare requests by priority for queue ordering."""
        if self.priority.value != other.priority.value:
            return self.priority.value < other.priority.value
        # If same priority, FIFO (earlier queued_at is higher priority)
        return self.queued_at < other.queued_at


class RequestQueueManager:
    """
    Manages a queue of inference requests with concurrency limits and prioritization.
    
    Features:
    - Limits concurrent inference operations to prevent memory exhaustion
    - Prioritizes cached requests over new inference
    - Provides estimated wait time in queue
    - Tracks queue metrics for monitoring
    """
    
    def __init__(
        self,
        max_concurrent: int = 2,
        max_queue_size: int = 100,
        timeout_seconds: float = 600.0
    ):
        """
        Initialize request queue manager.
        
        Args:
            max_concurrent: Maximum number of concurrent inference operations
            max_queue_size: Maximum number of requests in queue
            timeout_seconds: Maximum time a request can wait in queue
        """
        self.max_concurrent = max_concurrent
        self.max_queue_size = max_queue_size
        self.timeout_seconds = timeout_seconds
        
        self.queue = asyncio.PriorityQueue(maxsize=max_queue_size)
        self.active_requests = 0
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        # Metrics
        self.total_requests = 0
        self.completed_requests = 0
        self.failed_requests = 0
        self.timeout_requests = 0
        self.rejected_requests = 0
        self.total_wait_time_ms = 0.0
        self.total_execution_time_ms = 0.0
        
        # Recent request times for wait time estimation
        self.recent_execution_times = deque(maxlen=10)
        
        self._worker_task = None
        self._running = False
    
    async def start(self):
        """Start the queue worker."""
        if self._running:
            return
        
        self._running = True
        self._worker_task = asyncio.create_task(self._process_queue())
        logger.info(
            f"Request queue manager started | "
            f"max_concurrent={self.max_concurrent} | "
            f"max_queue_size={self.max_queue_size}"
        )
    
    async def stop(self):
        """Stop the queue worker."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("Request queue manager stopped")
    
    async def enqueue_request(
        self,
        request_id: str,
        task: Callable,
        args: tuple = (),
        kwargs: dict = None,
        priority: RequestPriority = RequestPriority.NORMAL
    ) -> Any:
        """
        Enqueue an inference request and wait for result.
        
        Args:
            request_id: Unique identifier for the request
            task: Async callable to execute
            args: Positional arguments for task
            kwargs: Keyword arguments for task
            priority: Request priority level
            
        Returns:
            Result from task execution
            
        Raises:
            asyncio.QueueFull: If queue is at capacity
            asyncio.TimeoutError: If request times out in queue
            Exception: Any exception raised by the task
        """
        if kwargs is None:
            kwargs = {}
        
        self.total_requests += 1
        
        # Check if queue is full
        if self.queue.full():
            self.rejected_requests += 1
            logger.warning(
                f"Request queue full | "
                f"request_id={request_id} | "
                f"queue_size={self.queue.qsize()} | "
                f"rejected_count={self.rejected_requests}"
            )
            raise asyncio.QueueFull("Request queue is at capacity. Please try again later.")
        
        # Create future for result
        future = asyncio.Future()
        
        # Create queued request
        queued_request = QueuedRequest(
            request_id=request_id,
            priority=priority,
            task=task,
            args=args,
            kwargs=kwargs,
            queued_at=time.time(),
            future=future
        )
        
        # Add to queue
        await self.queue.put(queued_request)
        
        queue_size = self.queue.qsize()
        estimated_wait = self.get_estimated_wait_time()
        
        logger.info(
            f"Request queued | "
            f"request_id={request_id} | "
            f"priority={priority.name} | "
            f"queue_size={queue_size} | "
            f"estimated_wait_ms={estimated_wait:.0f}"
        )
        
        # Wait for result with timeout
        try:
            result = await asyncio.wait_for(future, timeout=self.timeout_seconds)
            return result
        except asyncio.TimeoutError:
            self.timeout_requests += 1
            logger.error(
                f"Request timeout | "
                f"request_id={request_id} | "
                f"timeout_seconds={self.timeout_seconds}"
            )
            raise
    
    async def _process_queue(self):
        """Worker task that processes queued requests."""
        # Note: Queue worker logs don't have request_id context
        print("Queue worker started")
        
        while self._running:
            try:
                # Get next request from queue
                queued_request = await asyncio.wait_for(
                    self.queue.get(),
                    timeout=1.0
                )
                
                # Process request
                asyncio.create_task(self._execute_request(queued_request))
                
            except asyncio.TimeoutError:
                # No requests in queue, continue
                continue
            except Exception as e:
                logger.error(f"Error in queue worker: {e}", exc_info=True)
    
    async def _execute_request(self, queued_request: QueuedRequest):
        """
        Execute a queued request with concurrency control.
        
        Args:
            queued_request: The request to execute
        """
        request_id = queued_request.request_id
        
        # Calculate wait time
        wait_time_ms = (time.time() - queued_request.queued_at) * 1000
        self.total_wait_time_ms += wait_time_ms
        
        # Acquire semaphore to limit concurrency
        async with self.semaphore:
            self.active_requests += 1
            
            logger.info(
                f"Executing request | "
                f"request_id={request_id} | "
                f"wait_time_ms={wait_time_ms:.0f} | "
                f"active_requests={self.active_requests}"
            )
            
            start_time = time.time()
            
            try:
                # Execute the task
                result = await queued_request.task(
                    *queued_request.args,
                    **queued_request.kwargs
                )
                
                # Calculate execution time
                execution_time_ms = (time.time() - start_time) * 1000
                self.total_execution_time_ms += execution_time_ms
                self.recent_execution_times.append(execution_time_ms)
                
                # Set result
                if not queued_request.future.done():
                    queued_request.future.set_result(result)
                
                self.completed_requests += 1
                
                logger.info(
                    f"Request completed | "
                    f"request_id={request_id} | "
                    f"execution_time_ms={execution_time_ms:.0f} | "
                    f"total_time_ms={(wait_time_ms + execution_time_ms):.0f}"
                )
                
            except Exception as e:
                # Set exception
                if not queued_request.future.done():
                    queued_request.future.set_exception(e)
                
                self.failed_requests += 1
                
                logger.error(
                    f"Request failed | "
                    f"request_id={request_id} | "
                    f"error={str(e)}"
                )
            
            finally:
                self.active_requests -= 1
    
    def get_estimated_wait_time(self) -> float:
        """
        Estimate wait time for a new request based on queue size and recent execution times.
        
        Returns:
            Estimated wait time in milliseconds
        """
        queue_size = self.queue.qsize()
        
        if queue_size == 0:
            return 0.0
        
        # Use average of recent execution times
        if self.recent_execution_times:
            avg_execution_time = sum(self.recent_execution_times) / len(self.recent_execution_times)
        else:
            # Default estimate if no history
            avg_execution_time = 5000.0  # 5 seconds
        
        # Estimate based on queue position and concurrency
        # Requests ahead in queue / concurrent slots * avg execution time
        estimated_wait = (queue_size / self.max_concurrent) * avg_execution_time
        
        return estimated_wait
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """
        Get queue statistics for monitoring.
        
        Returns:
            Dictionary with queue metrics
        """
        avg_wait_time = 0.0
        if self.completed_requests > 0:
            avg_wait_time = self.total_wait_time_ms / self.completed_requests
        
        avg_execution_time = 0.0
        if self.completed_requests > 0:
            avg_execution_time = self.total_execution_time_ms / self.completed_requests
        
        success_rate = 0.0
        if self.total_requests > 0:
            success_rate = (self.completed_requests / self.total_requests) * 100
        
        return {
            "queue_size": self.queue.qsize(),
            "active_requests": self.active_requests,
            "max_concurrent": self.max_concurrent,
            "total_requests": self.total_requests,
            "completed_requests": self.completed_requests,
            "failed_requests": self.failed_requests,
            "timeout_requests": self.timeout_requests,
            "rejected_requests": self.rejected_requests,
            "success_rate_percent": round(success_rate, 2),
            "avg_wait_time_ms": round(avg_wait_time, 2),
            "avg_execution_time_ms": round(avg_execution_time, 2),
            "estimated_wait_time_ms": round(self.get_estimated_wait_time(), 2)
        }
    
    def reset_metrics(self):
        """Reset all metrics counters."""
        self.total_requests = 0
        self.completed_requests = 0
        self.failed_requests = 0
        self.timeout_requests = 0
        self.rejected_requests = 0
        self.total_wait_time_ms = 0.0
        self.total_execution_time_ms = 0.0
        self.recent_execution_times.clear()


# Global queue manager instance
_queue_manager: Optional[RequestQueueManager] = None


def get_queue_manager() -> RequestQueueManager:
    """
    Get the global request queue manager instance.
    
    Returns:
        Global RequestQueueManager instance
    """
    global _queue_manager
    if _queue_manager is None:
        _queue_manager = RequestQueueManager(
            max_concurrent=2,  # Limit to 2 concurrent inferences
            max_queue_size=100,
            timeout_seconds=600.0
        )
    return _queue_manager


async def initialize_queue_manager():
    """Initialize and start the global queue manager."""
    manager = get_queue_manager()
    await manager.start()
    # Note: Startup logs don't have request_id context
    print("Global request queue manager initialized")


async def shutdown_queue_manager():
    """Shutdown the global queue manager."""
    global _queue_manager
    if _queue_manager:
        await _queue_manager.stop()
        _queue_manager = None
        print("Global request queue manager shutdown")
