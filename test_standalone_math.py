#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.chat import convert_bracket_math_to_dollars

def test_standalone_math():
    """Test that standalone math formulas are converted to block format."""
    
    test_cases = [
        # Test standalone inline math
        ("Here's a formula:\n$C = S_0 N(d_1) - Xe^{-rt} N(d_2)$\nThat's it.", 
         "Here's a formula:\n$$\nC = S_0 N(d_1) - Xe^{-rt} N(d_2)\n$$\nThat's it."),
        
        # Test inline math that should stay inline
        ("The formula $x + y = z$ is simple.", 
         "The formula $x + y = z$ is simple."),
        
        # Test multiple standalone formulas
        ("First formula:\n$E = mc^2$\nSecond formula:\n$F = ma$\nDone.", 
         "First formula:\n$$\nE = mc^2\n$$\nSecond formula:\n$$\nF = ma\n$$\nDone."),
        
        # Test with whitespace
        ("  $a^2 + b^2 = c^2$  ", 
         "$$\na^2 + b^2 = c^2\n$$"),
        
        # Test mixed inline and standalone
        ("Inline: $x + y$ and standalone:\n$z = x + y$\nEnd.", 
         "Inline: $x + y$ and standalone:\n$$\nz = x + y\n$$\nEnd."),
    ]
    
    print("Testing standalone math conversion...")
    print("=" * 50)
    
    all_passed = True
    for i, (input_text, expected_output) in enumerate(test_cases, 1):
        actual_output = convert_bracket_math_to_dollars(input_text)
        
        if actual_output == expected_output:
            print(f"✓ Test {i} PASSED")
        else:
            print(f"✗ Test {i} FAILED")
            print(f"  Input:    {repr(input_text)}")
            print(f"  Expected: {repr(expected_output)}")
            print(f"  Actual:   {repr(actual_output)}")
            print()
            all_passed = False
    
    print("=" * 50)
    if all_passed:
        print("All tests PASSED! ✅")
    else:
        print("Some tests FAILED! ❌")
    
    return all_passed

if __name__ == "__main__":
    test_standalone_math() 