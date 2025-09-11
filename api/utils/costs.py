import os
PRICE_IN_PER_1K = float(os.getenv("PRICE_IN_PER_1K", "0.0005"))
PRICE_OUT_PER_1K = float(os.getenv("PRICE_OUT_PER_1K", "0.0015"))
def estimate_cost(input_tokens:int=0, output_tokens:int=0) -> float:
    return (input_tokens/1000.0)*PRICE_IN_PER_1K + (output_tokens/1000.0)*PRICE_OUT_PER_1K
