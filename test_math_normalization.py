#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.chat import convert_bracket_math_to_dollars

def test_math_normalization():
    """Test the math normalization function with various inputs."""
    
    test_cases = [
        # Test inline [ ... ] format
        ("The formula [C = S_0 N(d_1) - Xe^{-rt} N(d_2)] is important.", 
         "The formula $C = S_0 N(d_1) - Xe^{-rt} N(d_2)$ is important."),
        
        # Test block [ ... ] format
        ("Here's the formula:\n[C = S_0 N(d_1) - Xe^{-rt} N(d_2)]\nThat's it.", 
         "Here's the formula:\n$$\nC = S_0 N(d_1) - Xe^{-rt} N(d_2)\n$$\nThat's it."),
        
        # Test \\( ... \\) format
        ("The value \\(x + y\\) is calculated.", 
         "The value $x + y$ is calculated."),
        
        # Test \\[ ... \\] format
        ("The equation is:\n\\[E = mc^2\\]\nEinstein's famous formula.", 
         "The equation is:\n$$E = mc^2$$\nEinstein's famous formula."),
        
        # Test (( ... )) format
        ("The result ((a + b)^2)) is expanded.", 
         "The result $(a + b)^2$ is expanded."),
        
        # Test bullet point math
        ("* (B_x) represents the bond price\n* (P) is the principal", 
         "* $B_x$ represents the bond price\n* $P$ is the principal"),
        
        # Test equals sign math
        ("The value = (S) represents stock price", 
         "The value = $S$ represents stock price"),
        
        # Test mixed formats
        ("Formula [x^2 + y^2 = z^2] and \\(a + b\\) are both valid.", 
         "Formula $x^2 + y^2 = z^2$ and $a + b$ are both valid."),
    ]
    
    print("Testing math normalization function...")
    print("=" * 50)
    
    all_passed = True
    for i, (input_text, expected_output) in enumerate(test_cases, 1):
        actual_output = convert_bracket_math_to_dollars(input_text)
        
        if actual_output == expected_output:
            print(f"✓ Test {i} PASSED")
        else:
            print(f"✗ Test {i} FAILED")
            print(f"  Input:    {repr(input_text)}")
            print(f"  Input (raw): {input_text}")
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
    test_math_normalization() 