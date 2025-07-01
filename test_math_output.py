#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.chat import convert_bracket_math_to_dollars

def test_math_output():
    """Test what the actual output looks like for standalone math."""
    
    test_input = """Here's a formula:
$C = S_0 N(d_1) - Xe^{-rt} N(d_2)$
That's it.

And another one:
$E = mc^2$

And inline math: $x + y = z$ should stay inline."""
    
    print("Input:")
    print(repr(test_input))
    print("\n" + "="*50 + "\n")
    
    output = convert_bracket_math_to_dollars(test_input)
    
    print("Output:")
    print(repr(output))
    print("\n" + "="*50 + "\n")
    
    print("Formatted output:")
    print(output)
    print("\n" + "="*50 + "\n")
    
    # Check if the output contains $$ for block math
    if "$$" in output:
        print("✓ Block math ($$) detected in output")
    else:
        print("✗ No block math ($$) detected in output")
    
    # Count the number of $$ occurrences
    block_math_count = output.count("$$")
    print(f"Number of $$ occurrences: {block_math_count}")

if __name__ == "__main__":
    test_math_output() 