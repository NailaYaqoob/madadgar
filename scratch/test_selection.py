import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.agents.orchestrator import Orchestrator

async def test_selection_flow():
    orchestrator = Orchestrator()
    
    print("\n--- Phase 1: Requesting a Service ---")
    msg1 = "I need a plumber in Islamabad"
    result1 = await orchestrator.process_request(user_id="test_user_selection", text=msg1)
    
    print(f"Action: {result1.get('intent_action')}")
    print(f"Status: {result1.get('status', 'N/A')}")
    print(f"Clarification Required: {result1.get('requires_clarification')}")
    print(f"Message from AI:\n{result1.get('clarification_message')}")
    
    if result1.get('requires_clarification') and "found these top-rated professionals" in result1.get('clarification_message').lower():
        print("Success: Orchestrator presented options instead of direct booking.")
    else:
        print("Error: Orchestrator did not present options.")

    print("\n--- Phase 2: Selecting an Option ---")
    msg2 = "Book the first one"
    # In a real scenario, we might need to pass the conversation state/history.
    # For this simple test, we simulate the follow-up request.
    result2 = await orchestrator.process_request(user_id="test_user_selection", text=msg2)
    
    print(f"Status: {result2.get('booking_status')}")
    print(f"Selected Provider: {result2.get('selected_provider_id')}")
    print(f"Final Response: {result2.get('final_response')}")
    
    if result2.get('booking_status') == "confirmed":
        print("Success: Booking confirmed after selection.")
    else:
        print("Error: Booking not confirmed after selection.")

if __name__ == "__main__":
    asyncio.run(test_selection_flow())
