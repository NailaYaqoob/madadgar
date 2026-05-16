import os
import shutil
from pathlib import Path

# Configuration
BRAIN_DIR = Path(r"C:\Users\lenovo\.gemini\antigravity\brain")
SUBMISSION_DIR = Path(r"e:\Madadgar\submissions\logs")

# Relevant Conversation IDs for Madadgar
CONVERSATION_IDS = [
    "93f27688-ba63-46db-84ea-54e7733001ee", # Building
    "7e13470d-0d13-498d-93ae-852f69af3018", # Testing
    "c6920a2e-9dc9-46d9-96ea-660f23dd1351", # Documenting
    "64aa33cd-7dd6-4548-b78f-89a3f003ad95", # Debugging
    "a8d2f40f-f8a9-4871-b646-43729de264b0", # Submission prep (current)
]

def collect_logs():
    print(f"Starting log collection into: {SUBMISSION_DIR}")
    
    # Create submission directory
    SUBMISSION_DIR.mkdir(parents=True, exist_ok=True)
    
    for conv_id in CONVERSATION_IDS:
        log_path = BRAIN_DIR / conv_id / ".system_generated" / "logs" / "overview.txt"
        
        if log_path.exists():
            # Get a friendly name for the log based on the task
            dest_name = f"antigravity_trace_{conv_id[:8]}.txt"
            dest_path = SUBMISSION_DIR / dest_name
            
            print(f"Copying log: {conv_id[:8]}... -> {dest_name}")
            shutil.copy2(log_path, dest_path)
        else:
            print(f"Warning: Log not found for {conv_id}")

    print("\nLog collection complete!")
    print(f"Files are located in: {SUBMISSION_DIR}")

if __name__ == "__main__":
    collect_logs()
