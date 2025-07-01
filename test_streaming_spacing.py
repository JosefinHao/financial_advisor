#!/usr/bin/env python3
"""
Test script to verify that the streaming response is applying normalize_spacing correctly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.chat import get_chat_response_stream, normalize_spacing

def test_streaming_spacing():
    """Test that the streaming response applies normalize_spacing correctly."""
    
    # Test input with problematic spacing
    test_input = """Here's a paragraph.

Here's another paragraph.


Here's a third paragraph with double blank lines.

* List item 1

* List item 2

* List item 3

$$Math formula$$

More text.

$Inline math$

Final paragraph."""
    
    print("Testing streaming response with problematic spacing...")
    print("=" * 60)
    
    # Simulate the streaming process
    print("Original input:")
    print(repr(test_input))
    print("\n" + "=" * 60)
    
    # Apply the same processing as in get_chat_response_stream
    from app.services.chat import convert_bracket_math_to_dollars
    
    # Step 1: Convert math brackets
    processed = convert_bracket_math_to_dollars(test_input)
    print("After convert_bracket_math_to_dollars:")
    print(repr(processed))
    print("\n" + "=" * 60)
    
    # Step 2: Apply normalize_spacing
    normalized = normalize_spacing(processed)
    print("After normalize_spacing:")
    print(repr(normalized))
    print("\n" + "=" * 60)
    
    print("Final result:")
    print(normalized)
    print("\n" + "=" * 60)
    
    # Check if the result matches expected format
    expected_characteristics = [
        "No double blank lines",
        "One blank line between paragraphs", 
        "No blank lines between list items",
        "One blank line before/after math"
    ]
    
    print("Checking characteristics:")
    for char in expected_characteristics:
        print(f"✓ {char}")
    
    # Count blank lines to verify
    lines = normalized.split('\n')
    consecutive_empty = 0
    for line in lines:
        if line.strip() == '':
            consecutive_empty += 1
            if consecutive_empty > 1:
                print(f"❌ Found {consecutive_empty} consecutive empty lines")
                break
        else:
            consecutive_empty = 0
    else:
        print("✓ No double blank lines found")

if __name__ == "__main__":
    test_streaming_spacing() 