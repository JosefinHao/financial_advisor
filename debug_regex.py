#!/usr/bin/env python3

import re

def test_double_parens_regex():
    """Test the (( ... )) regex pattern specifically."""
    
    test_cases = [
        "((a + b)^2)",
        "((x))",
        "((simple))",
        "((a + b))",
        "((a + b)^2) is expanded",
        "The result ((a + b)^2) is expanded.",
        "((a + b)^2) and ((c + d)^3)",
        "((a + b))",  # This works
        "((a + b)^2)",  # This doesn't work
        "((a + b)**2)",  # Test with ** instead of ^
        "((a + b)²)",   # Test with ² instead of ^2
    ]
    
    patterns = [
        r"\(\((.*?)\)\)",
        r"\(\(([^()]*)\)\)",
        r"\(\((.+?)\)\)",
        r"\(\(([^)]*)\)\)",
        r"\(\(([^)]*(?:\)[^)]*)*)\)\)",  # New pattern
        r"\(\((.+)\)\)",  # Greedy pattern
        r"\(\((.*)\)\)",  # Very simple greedy pattern
    ]
    
    print("Testing (( ... )) regex patterns...")
    print("=" * 60)
    
    for i, pattern in enumerate(patterns, 1):
        print(f"\nPattern {i}: {pattern}")
        print("-" * 40)
        
        for test_case in test_cases:
            matches = re.findall(pattern, test_case, flags=re.DOTALL)
            if matches:
                print(f"✓ '{test_case}' -> {matches}")
            else:
                print(f"✗ '{test_case}' -> NO MATCH")
    
    # Test the specific case that's failing
    print("\n" + "=" * 60)
    print("Testing the specific failing case:")
    test_text = "The result ((a + b)^2) is expanded."
    print(f"Input: {repr(test_text)}")
    
    for i, pattern in enumerate(patterns, 1):
        result = re.sub(pattern, r"$\1$", test_text, flags=re.DOTALL)
        print(f"Pattern {i}: {result}")
    
    # Test with raw string to see if ^ is being interpreted as start of line
    print("\n" + "=" * 60)
    print("Testing with different approaches:")
    
    # Test 1: Escape the ^ character
    pattern_escaped = r"\(\((.*?)\)\)"
    result1 = re.sub(pattern_escaped, r"$\1$", "((a + b)^2)", flags=re.DOTALL)
    print(f"Escaped pattern: '((a + b)^2)' -> {result1}")
    
    # Test 2: Use re.escape to see what's happening
    print(f"re.escape('((a + b)^2)'): {re.escape('((a + b)^2)')}")
    
    # Test 3: Check if ^ is being treated as start of line anchor
    test_with_caret = "((a + b)^2)"
    print(f"Testing: {repr(test_with_caret)}")
    print(f"Contains ^: {'^' in test_with_caret}")
    print(f"Raw string: {test_with_caret}")

    # Print Unicode code points for the failing string
    failing_str = '((a + b)^2)'
    print('\nUnicode code points for ((a + b)^2):')
    print([ord(c) for c in failing_str])
    print('Characters:', [c for c in failing_str])

if __name__ == "__main__":
    test_double_parens_regex() 