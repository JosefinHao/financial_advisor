def manual_double_parens_replace(s):
    result = ''
    i = 0
    while i < len(s):
        if s[i:i+2] == '((':  # Found ((
            start = i + 2
            end = s.find('))', start)
            if end != -1:
                result += f'${s[start:end]}$'
                i = end + 2
            else:
                result += s[i:]
                break
        else:
            result += s[i]
            i += 1
    return result

if __name__ == '__main__':
    test_cases = [
        '((a + b)^2)',
        'The result ((a + b)^2) is expanded.',
        '((a + b))',
        '((a + b)^2) and ((c + d)^3)',
    ]
    for s in test_cases:
        print(f'Input:    {s}')
        print(f'Output:   {manual_double_parens_replace(s)}')
        print('-' * 40) 