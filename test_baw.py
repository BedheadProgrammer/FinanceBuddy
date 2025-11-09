"""
Test script for Barone-Adesi-Whaley American option pricing.
Demonstrates the BAWAmericanOptionCalculator class.
"""

from eurocalc.calculator import BAWAmericanOptionCalculator, GreeksCalculator

def test_baw_american_options():
    """Test BAW approximation with example calculations."""
    
    # Example parameters
    S = 100.0      # Spot price
    K = 100.0      # Strike (at-the-money)
    r = 0.05       # 5% risk-free rate
    q = 0.02       # 2% dividend yield
    sigma = 0.25   # 25% volatility
    T = 1.0        # 1 year to expiry
    
    print("="*70)
    print("BARONE-ADESI-WHALEY AMERICAN OPTION PRICING TEST")
    print("="*70)
    print(f"\nParameters:")
    print(f"  Spot (S):           ${S:.2f}")
    print(f"  Strike (K):         ${K:.2f}")
    print(f"  Risk-free rate (r): {r:.2%}")
    print(f"  Dividend yield (q): {q:.2%}")
    print(f"  Volatility (σ):     {sigma:.2%}")
    print(f"  Time to expiry (T): {T:.2f} years")
    print("-"*70)
    
    # Initialize calculators
    baw_calc = BAWAmericanOptionCalculator()
    
    # Test American CALL
    print("\n1. AMERICAN CALL OPTION:")
    call_result = baw_calc.compute(S, K, r, q, sigma, T, "CALL")
    
    print(f"   European price:          ${call_result['european_price']:.4f}")
    print(f"   American price:          ${call_result['american_price']:.4f}")
    print(f"   Early exercise premium:  ${call_result['early_exercise_premium']:.4f}")
    print(f"   Critical price (S*):     ${call_result['critical_price']:.4f}")
    
    if call_result['critical_price'] == float('inf'):
        print(f"   → Never optimal to exercise early (q={q} is small)")
    elif S < call_result['critical_price']:
        print(f"   → Current spot ${S:.2f} < S* = ${call_result['critical_price']:.2f}")
        print(f"   → Hold the option (don't exercise)")
    else:
        print(f"   → Current spot ${S:.2f} ≥ S* = ${call_result['critical_price']:.2f}")
        print(f"   → Exercise immediately!")
    
    # Test American PUT
    print("\n2. AMERICAN PUT OPTION:")
    put_result = baw_calc.compute(S, K, r, q, sigma, T, "PUT")
    
    print(f"   European price:          ${put_result['european_price']:.4f}")
    print(f"   American price:          ${put_result['american_price']:.4f}")
    print(f"   Early exercise premium:  ${put_result['early_exercise_premium']:.4f}")
    print(f"   Critical price (S**):    ${put_result['critical_price']:.4f}")
    
    if S > put_result['critical_price']:
        print(f"   → Current spot ${S:.2f} > S** = ${put_result['critical_price']:.2f}")
        print(f"   → Hold the option (don't exercise)")
    else:
        print(f"   → Current spot ${S:.2f} ≤ S** = ${put_result['critical_price']:.2f}")
        print(f"   → Exercise immediately!")
    
    # Test deep in-the-money PUT
    print("\n3. DEEP ITM AMERICAN PUT (S=80, K=100):")
    S_itm = 80.0
    put_itm = baw_calc.compute(S_itm, K, r, q, sigma, T, "PUT")
    
    intrinsic = K - S_itm
    print(f"   Intrinsic value:         ${intrinsic:.4f}")
    print(f"   European price:          ${put_itm['european_price']:.4f}")
    print(f"   American price:          ${put_itm['american_price']:.4f}")
    print(f"   Early exercise premium:  ${put_itm['early_exercise_premium']:.4f}")
    print(f"   Critical price (S**):    ${put_itm['critical_price']:.4f}")
    
    if S_itm <= put_itm['critical_price']:
        print(f"   → S=${S_itm:.2f} ≤ S**=${put_itm['critical_price']:.2f}")
        print(f"   → EXERCISE NOW! American price = intrinsic value = ${intrinsic:.4f}")
    
    # Test call with zero dividends
    print("\n4. AMERICAN CALL WITH NO DIVIDENDS (q=0):")
    q_zero = 0.0
    call_no_div = baw_calc.compute(S, K, r, q_zero, sigma, T, "CALL")
    
    print(f"   European price:          ${call_no_div['european_price']:.4f}")
    print(f"   American price:          ${call_no_div['american_price']:.4f}")
    print(f"   Early exercise premium:  ${call_no_div['early_exercise_premium']:.4f}")
    print(f"   → American call = European call (never exercise early when q=0)")
    
    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("="*70)
    print("• American CALL with dividends (q>0): May exercise early before ex-div")
    print("• American PUT: Always has early exercise premium (can lock in K)")
    print("• Critical price S* (call) or S** (put): Early exercise boundary")
    print("• If option is deep ITM: American price ≈ intrinsic value")
    print("="*70)

if __name__ == "__main__":
    test_baw_american_options()
