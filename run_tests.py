#!/usr/bin/env python3
"""
Test runner script for the Financial Advisor project.
"""

import os
import sys
import subprocess
import argparse
import time
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(command)}")
    print(f"{'='*60}")
    
    start_time = time.time()
    result = subprocess.run(command, capture_output=True, text=True)
    end_time = time.time()
    
    print(f"Duration: {end_time - start_time:.2f} seconds")
    print(f"Exit code: {result.returncode}")
    
    if result.stdout:
        print("\nSTDOUT:")
        print(result.stdout)
    
    if result.stderr:
        print("\nSTDERR:")
        print(result.stderr)
    
    if result.returncode != 0:
        print(f"\n❌ {description} FAILED")
        return False
    else:
        print(f"\n✅ {description} PASSED")
        return True

def run_unit_tests():
    """Run unit tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/test_utils.py", "-v", "--tb=short"],
        "Unit Tests"
    )

def run_api_tests():
    """Run API tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/test_api_endpoints.py", "-v", "--tb=short"],
        "API Tests"
    )

def run_integration_tests():
    """Run integration tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/test_integration.py", "-v", "--tb=short"],
        "Integration Tests"
    )

def run_frontend_tests():
    """Run frontend tests."""
    client_dir = Path("client")
    if not client_dir.exists():
        print("❌ Client directory not found. Skipping frontend tests.")
        return True
    
    os.chdir(client_dir)
    success = run_command(
        ["npm", "test", "--", "--watchAll=false"],
        "Frontend Tests"
    )
    os.chdir("..")
    return success

def run_all_tests():
    """Run all tests with coverage."""
    return run_command(
        ["python", "-m", "pytest", "tests/", "-v", "--cov=app", "--cov-report=html", "--cov-report=term-missing"],
        "All Tests with Coverage"
    )

def run_linting():
    """Run code linting."""
    success = True
    
    # Run flake8
    success &= run_command(
        ["python", "-m", "flake8", "app/", "tests/", "--max-line-length=100", "--ignore=E501,W503"],
        "Flake8 Linting"
    )
    
    # Run black check
    success &= run_command(
        ["python", "-m", "black", "--check", "app/", "tests/"],
        "Black Code Formatting Check"
    )
    
    # Run isort check
    success &= run_command(
        ["python", "-m", "isort", "--check-only", "app/", "tests/"],
        "Import Sorting Check"
    )
    
    return success

def run_security_checks():
    """Run security checks."""
    success = True
    
    # Run bandit
    success &= run_command(
        ["python", "-m", "bandit", "-r", "app/", "-f", "json", "-o", "bandit-report.json"],
        "Bandit Security Scan"
    )
    
    # Run safety
    success &= run_command(
        ["python", "-m", "safety", "check", "--json", "--output", "safety-report.json"],
        "Safety Dependency Check"
    )
    
    return success

def run_performance_tests():
    """Run performance tests."""
    return run_command(
        ["python", "-m", "pytest", "tests/test_integration.py::TestPerformanceIntegration", "-v", "--benchmark-only"],
        "Performance Tests"
    )

def generate_test_report():
    """Generate a comprehensive test report."""
    report_file = "test_report.md"
    
    with open(report_file, "w") as f:
        f.write("# Financial Advisor Test Report\n\n")
        f.write(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # Test results summary
        f.write("## Test Results Summary\n\n")
        
        # Coverage report
        if os.path.exists("htmlcov/index.html"):
            f.write("### Coverage Report\n")
            f.write("- HTML coverage report: `htmlcov/index.html`\n")
            f.write("- Coverage data: `coverage.xml`\n\n")
        
        # Security reports
        if os.path.exists("bandit-report.json"):
            f.write("### Security Reports\n")
            f.write("- Bandit security scan: `bandit-report.json`\n")
        
        if os.path.exists("safety-report.json"):
            f.write("- Safety dependency check: `safety-report.json`\n\n")
        
        # Performance reports
        if os.path.exists(".benchmarks"):
            f.write("### Performance Reports\n")
            f.write("- Benchmark results: `.benchmarks/`\n\n")
        
        f.write("## Next Steps\n\n")
        f.write("1. Review any failed tests\n")
        f.write("2. Address security vulnerabilities\n")
        f.write("3. Improve test coverage if needed\n")
        f.write("4. Optimize performance bottlenecks\n")
    
    print(f"📄 Test report generated: {report_file}")

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="Run tests for Financial Advisor project")
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--api", action="store_true", help="Run API tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--frontend", action="store_true", help="Run frontend tests only")
    parser.add_argument("--lint", action="store_true", help="Run linting only")
    parser.add_argument("--security", action="store_true", help="Run security checks only")
    parser.add_argument("--performance", action="store_true", help="Run performance tests only")
    parser.add_argument("--all", action="store_true", help="Run all tests and checks")
    parser.add_argument("--report", action="store_true", help="Generate test report")
    
    args = parser.parse_args()
    
    # If no specific test type is specified, run all
    if not any([args.unit, args.api, args.integration, args.frontend, args.lint, args.security, args.performance, args.all]):
        args.all = True
    
    print("🚀 Financial Advisor Test Runner")
    print("=" * 50)
    
    success = True
    
    if args.unit or args.all:
        success &= run_unit_tests()
    
    if args.api or args.all:
        success &= run_api_tests()
    
    if args.integration or args.all:
        success &= run_integration_tests()
    
    if args.frontend or args.all:
        success &= run_frontend_tests()
    
    if args.lint or args.all:
        success &= run_linting()
    
    if args.security or args.all:
        success &= run_security_checks()
    
    if args.performance or args.all:
        success &= run_performance_tests()
    
    if args.report or args.all:
        generate_test_report()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 