import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.agents.orchestrator import Orchestrator

async def test_cancellation():
    orchestrator = Orchestrator()
    
    test_messages = [
        "Cancel my booking please",
        "Nahin chahiye ab service, cancel kardo",
        "Abort the request"
    ]
    
    for msg in test_messages:
        print(f"\n--- Testing Message: '{msg}' ---")
        result = await orchestrator.process_request(user_id="test_user_123", text=msg)
        
        print(f"Action: {result.get('intent_action')}")
        print(f"Status: {result.get('booking_status')}")
        print(f"Final Response: {result.get('final_response')}")
        
        # Check telemetry for skipping nodes
        agent_names = [log['agent'] for log in result['telemetry'] if log.get('agent')]
        print(f"Agents invoked: {set(agent_names)}")
        
        if "DiscoveryAgent" in agent_names or "LocationAgent" in agent_names:
            print("Error: Discovery or Location agents were invoked during cancellation!")
        else:
            print("Success: Discovery and Location nodes were skipped.")

if __name__ == "__main__":
    asyncio.run(test_cancellation())
