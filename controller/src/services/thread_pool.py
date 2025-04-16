import threading
import queue
from src.services.logging_service import printt


class ThreadPool:
    def __init__(self, num_workers=3):
        self.queue = queue.Queue()
        self.shutdown_flag = threading.Event()
        self.threads = []

        for i in range(num_workers):
            t = threading.Thread(
                target=self._worker, name=f"FR-Worker-{i+1}", daemon=True
            )
            t.start()
            self.threads.append(t)

    def _worker(self):
        while not self.shutdown_flag.is_set():
            try:
                func, args, kwargs = self.queue.get(timeout=1)
                try:
                    func(*args, **kwargs)
                except Exception as e:
                    printt(f"Error in face recognition worker task: {e}")
                finally:
                    self.queue.task_done()
            except queue.Empty:
                continue

    def submit(self, func, *args, **kwargs):
        self.queue.put((func, args, kwargs))

    def shutdown(self):
        self.shutdown_flag.set()
        for t in self.threads:
            t.join()
