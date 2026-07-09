#!/usr/bin/env python3
"""
Playwright Python Skill - Universal Executor

This script executes Playwright Python test scripts with proper error handling
and output capture.

Usage:
    python run.py /tmp/playwright_test_page.py
    python run.py -c "inline code here"
"""

import sys
import os
import subprocess
import tempfile
from pathlib import Path


def execute_script(script_path: str) -> int:
    """Execute a Python script and return the exit code."""
    if not os.path.exists(script_path):
        print(f"❌ Error: Script not found: {script_path}")
        return 1
    
    print(f"🚀 Executing: {script_path}")
    print("-" * 50)
    
    # Run the script with Python
    result = subprocess.run(
        [sys.executable, script_path],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=False,
    )
    
    print("-" * 50)
    if result.returncode == 0:
        print("✅ Script completed successfully")
    else:
        print(f"❌ Script failed with exit code: {result.returncode}")
    
    return result.returncode


def execute_inline(code: str) -> int:
    """Execute inline Python code and return the exit code."""
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.py',
        delete=False,
        prefix='playwright_inline_'
    ) as f:
        f.write(code)
        temp_path = f.name
    
    try:
        return execute_script(temp_path)
    finally:
        try:
            os.unlink(temp_path)
        except:
            pass


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nExamples:")
        print("  python run.py /tmp/playwright_test_page.py")
        print('  python run.py -c "from playwright.sync_api import sync_playwright; print(\'test\')"')
        sys.exit(1)
    
    if sys.argv[1] == '-c' and len(sys.argv) > 2:
        # Inline code execution
        code = sys.argv[2]
        exit_code = execute_inline(code)
    else:
        # File execution
        script_path = sys.argv[1]
        exit_code = execute_script(script_path)
    
    sys.exit(exit_code)


if __name__ == '__main__':
    main()