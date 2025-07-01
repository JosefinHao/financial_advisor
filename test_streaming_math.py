#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def simulate_streaming_math():
    """Simulate the streaming behavior to test math block buffering."""
    
    # Simulate the chunks from the network response
    chunks = [
        "The Black-Scholes formula for pricing a European call option is:\n\n",
        "$$C = S_0 N(d_1)",
        " - Xe^{-rt} N(d_2)",
        "$$\n\n",
        "Where:\n",
        "- $C$ = Price of the call option\n",
        "- $S_0$ = Current price of the underlying asset\n",
        "- $X$ = Strike price of the option\n",
        "- $r$ = Risk-free interest rate\n",
        "- $t$ = Time to expiration\n",
        "- $N(d)$ = Cumulative distribution function of the standard normal distribution\n",
        "- $d_1$ and $d_2$ are calculated as follows:\n\n",
        "$$d_1 = \\frac{\\ln(S_0/X)",
        " + (r + \\sigma^2/2)t}{\\sigma \\sqrt{t}}$$\n",
        "$$d_2 = d_1 - \\sigma \\sqrt{t}$$\n\n",
        "This formula is essential in options pricing as it provides a way to calculate the theoretical price of a European call option based on factors such as the current price of the underlying asset,",
        " the option's strike price,",
        " time to expiration,",
        " risk-free interest rate,",
        " and the volatility of the underlying asset.",
        " Investors use the Black-Scholes model to make informed decisions and assess the fair value of options contracts."
    ]
    
    print("Simulating streaming with math block buffering...")
    print("=" * 60)
    
    buffer = ""
    in_math_block = False
    math_block_start = 0
    yielded_chunks = []
    
    for i, chunk in enumerate(chunks):
        print(f"\nChunk {i+1}: {repr(chunk)}")
        buffer += chunk
        
        # Check if we're entering a math block
        if "$$" in buffer and not in_math_block:
            in_math_block = True
            math_block_start = buffer.find("$$")
            print(f"  → Entering math block at position {math_block_start}")
        
        # Check if we're exiting a math block
        if in_math_block and buffer.count("$$") >= 2:
            # Find the end of the math block
            first_dollar = buffer.find("$$", math_block_start + 2)
            if first_dollar != -1:
                # We have a complete math block, yield everything up to the end
                complete_chunk = buffer[:first_dollar + 2]
                yielded_chunks.append(complete_chunk)
                print(f"  → Yielding complete math block: {repr(complete_chunk)}")
                buffer = buffer[first_dollar + 2:]
                in_math_block = False
                math_block_start = 0
                continue
        
        # If we're not in a math block, yield when we have complete words or punctuation
        if not in_math_block and len(buffer) > 0 and (
            buffer.endswith(' ') or buffer.endswith('\n') or 
            buffer.endswith('.') or buffer.endswith(',') or 
            buffer.endswith('!') or buffer.endswith('?') or
            buffer.endswith(']') or buffer.endswith(')') or
            buffer.endswith(':') or buffer.endswith(';')
        ):
            yielded_chunks.append(buffer)
            print(f"  → Yielding regular chunk: {repr(buffer)}")
            buffer = ""
    
    # Yield any remaining buffer content
    if buffer:
        yielded_chunks.append(buffer)
        print(f"  → Yielding final buffer: {repr(buffer)}")
    
    print("\n" + "=" * 60)
    print("Final yielded chunks:")
    for i, chunk in enumerate(yielded_chunks):
        print(f"{i+1}. {repr(chunk)}")
    
    # Check if math blocks are complete
    print("\n" + "=" * 60)
    print("Math block analysis:")
    for i, chunk in enumerate(yielded_chunks):
        if "$$" in chunk:
            dollar_count = chunk.count("$$")
            if dollar_count % 2 == 0:
                print(f"✓ Chunk {i+1}: Complete math block ({dollar_count} $$)")
            else:
                print(f"✗ Chunk {i+1}: Incomplete math block ({dollar_count} $$)")

if __name__ == "__main__":
    simulate_streaming_math() 