def calculate_tax(income):
    brackets = [
        (0, 10275, 0.10),
        (10275, 41775, 0.12),
        (41775, 89075, 0.22),
        (89075, 170050, 0.24),
        (170050, 215950, 0.32),
        (215950, 539900, 0.35),
        (539900, float("inf"), 0.37),
    ]

    tax = 0
    for lower, upper, rate in brackets:
        if income > lower:
            taxable_income = min(income, upper) - lower
            tax += taxable_income * rate
        else:
            break

    return {"income": income, "estimated_tax": round(tax, 2)}
