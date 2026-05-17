import logging
from pythonjsonlogger import jsonlogger
import datetime

def setup_json_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
        
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        '%(timestamp)s %(levelname)s %(correlation_id)s %(agent_name)s %(log_type)s %(message)s'
    )
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)

class AgentLogger:
    def __init__(self, correlation_id: str, agent_name: str, telemetry: list = None):
        self.correlation_id = correlation_id
        self.agent_name = agent_name
        self.telemetry = telemetry
        self.logger = logging.getLogger(agent_name)

    def _log(self, log_type: str, message: str, level: int = logging.INFO, **kwargs):
        extra = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "correlation_id": self.correlation_id,
            "agent_name": self.agent_name,
            "log_type": log_type,
            **kwargs
        }
        self.logger.log(level, message, extra=extra)

        if self.telemetry is not None:
            entry = {
                "timestamp": extra["timestamp"],
                "agent": self.agent_name,
                "type": log_type,
                "message": message,
            }
            if kwargs.get("metadata") is not None:
                entry["metadata"] = kwargs["metadata"]
            if "execution_duration_ms" in kwargs:
                entry["duration_ms"] = kwargs["execution_duration_ms"]
            self.telemetry.append(entry)

    def reasoning(self, message: str, context: dict = None):
        self._log("reasoning", message, metadata=context)

    def tool_execution(self, tool_name: str, duration_ms: int, status: str, args: dict = None):
        self._log("tool_execution", f"Executed {tool_name}", metadata={"args": args, "status": status}, execution_duration_ms=duration_ms)

    def state_transition(self, message: str, context: dict = None):
        self._log("state_transition", message, metadata=context)

    def booking_lifecycle(self, message: str, context: dict = None):
        self._log("booking_lifecycle", message, metadata=context)
