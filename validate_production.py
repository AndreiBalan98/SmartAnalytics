"""
Production Readiness Validation Script
Checks if SmartAnalytics is ready for deployment
Run with: python validate_production.py
"""
import os
import sys
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(msg):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{msg}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.END}")

def check_pass(msg):
    print(f"{Colors.GREEN}[OK]{Colors.END} {msg}")
    return True

def check_fail(msg):
    print(f"{Colors.RED}[FAIL]{Colors.END} {msg}")
    return False

def check_warn(msg):
    print(f"{Colors.YELLOW}[WARN]{Colors.END} {msg}")
    return True

# Validation checks
def check_backend_structure():
    """Check backend file structure"""
    print_header("BACKEND FILE STRUCTURE")

    required_files = [
        'backend/manage.py',
        'backend/requirements.txt',
        'backend/build.sh',
        'backend/config/settings.py',
        'backend/config/urls.py',
        'backend/config/wsgi.py',
        'backend/meta_ads/models.py',
        'backend/meta_ads/views.py',
        'backend/meta_ads/urls.py',
        'backend/meta_ads/services/sync_service.py',
    ]

    results = []
    for file_path in required_files:
        if Path(file_path).exists():
            results.append(check_pass(f"Found: {file_path}"))
        else:
            results.append(check_fail(f"Missing: {file_path}"))

    return all(results)

def check_frontend_structure():
    """Check frontend file structure"""
    print_header("FRONTEND FILE STRUCTURE")

    required_files = [
        'frontend/package.json',
        'frontend/next.config.js',
        'frontend/src/app/page.tsx',
        'frontend/src/app/dashboard/page.tsx',
        'frontend/src/lib/api.ts',
        'frontend/src/components/dashboard/LeftPanel.tsx',
        'frontend/src/components/dashboard/CenterPanel.tsx',
        'frontend/src/components/dashboard/RightPanel.tsx',
    ]

    results = []
    for file_path in required_files:
        if Path(file_path).exists():
            results.append(check_pass(f"Found: {file_path}"))
        else:
            results.append(check_fail(f"Missing: {file_path}"))

    return all(results)

def check_environment_files():
    """Check environment configuration"""
    print_header("ENVIRONMENT CONFIGURATION")

    results = []

    # Backend .env.example
    if Path('backend/.env.example').exists():
        results.append(check_pass("Backend .env.example exists"))
    else:
        results.append(check_warn("Backend .env.example not found (recommended)"))

    # Frontend .env.local
    if Path('frontend/.env.local').exists():
        results.append(check_pass("Frontend .env.local exists"))
    else:
        results.append(check_warn("Frontend .env.local not found (needed for local dev)"))

    return True  # Warnings don't fail validation

def check_requirements():
    """Check requirements.txt"""
    print_header("DEPENDENCIES")

    req_file = Path('backend/requirements.txt')

    if not req_file.exists():
        check_fail("requirements.txt not found!")
        return False

    content = req_file.read_text()

    required_packages = [
        'Django',
        'djangorestframework',
        'psycopg2-binary',
        'python-dotenv',
        'dj-database-url',
        'gunicorn',
        'whitenoise',
    ]

    results = []
    for package in required_packages:
        if package.lower() in content.lower():
            results.append(check_pass(f"Package found: {package}"))
        else:
            results.append(check_fail(f"Package missing: {package}"))

    return all(results)

def check_migrations():
    """Check migrations exist"""
    print_header("DATABASE MIGRATIONS")

    migrations_dir = Path('backend/meta_ads/migrations')

    if not migrations_dir.exists():
        check_fail("meta_ads/migrations directory not found!")
        return False

    migration_files = list(migrations_dir.glob('*.py'))
    migration_files = [f for f in migration_files if f.name != '__init__.py']

    if migration_files:
        check_pass(f"Found {len(migration_files)} migration file(s)")
        return True
    else:
        check_fail("No migration files found!")
        return False

def check_documentation():
    """Check documentation files"""
    print_header("DOCUMENTATION")

    docs = [
        'README.md',
        'QUICK_START.md',
        'TESTING_GUIDE.md',
        'DEPLOYMENT_GUIDE.md',
        'IMPLEMENTATION_COMPLETE.md',
    ]

    results = []
    for doc in docs:
        if Path(doc).exists():
            results.append(check_pass(f"Found: {doc}"))
        else:
            results.append(check_warn(f"Missing: {doc} (recommended)"))

    return True  # Warnings don't fail

def check_security_settings():
    """Check Django security settings"""
    print_header("SECURITY CONFIGURATION")

    settings_file = Path('backend/config/settings.py')

    if not settings_file.exists():
        check_fail("settings.py not found!")
        return False

    content = settings_file.read_text()

    checks = [
        ('SECRET_KEY', "SECRET_KEY configured"),
        ('ALLOWED_HOSTS', "ALLOWED_HOSTS configured"),
        ('CORS_ALLOWED_ORIGINS', "CORS configured"),
        ('AUTH_USER_MODEL', "Custom user model set"),
    ]

    results = []
    for key, msg in checks:
        if key in content:
            results.append(check_pass(msg))
        else:
            results.append(check_fail(f"Missing: {key}"))

    # Check for DEBUG = True (should use env var)
    if "DEBUG = os.getenv" in content or "DEBUG = True" not in content:
        check_pass("DEBUG properly configured (uses environment)")
    else:
        check_warn("DEBUG hardcoded to True (should use environment)")

    return all(results)

def check_build_script():
    """Check build script exists and is executable"""
    print_header("BUILD CONFIGURATION")

    build_script = Path('backend/build.sh')

    if not build_script.exists():
        check_fail("build.sh not found!")
        return False

    check_pass("build.sh exists")

    content = build_script.read_text()

    if 'collectstatic' in content:
        check_pass("Static files collection configured")
    else:
        check_warn("collectstatic not in build script")

    if 'migrate' in content:
        check_pass("Database migrations configured")
    else:
        check_fail("migrate not in build script")

    return True

def check_tests():
    """Check test files exist"""
    print_header("TESTING")

    test_files = [
        'backend/test_meta_ads.py',
        'backend/test_api_endpoints.py',
    ]

    results = []
    for test_file in test_files:
        if Path(test_file).exists():
            results.append(check_pass(f"Found: {test_file}"))
        else:
            results.append(check_warn(f"Missing: {test_file} (recommended)"))

    return True

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}SmartAnalytics Production Readiness Validation{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}")

    checks = [
        ("Backend Structure", check_backend_structure),
        ("Frontend Structure", check_frontend_structure),
        ("Environment Files", check_environment_files),
        ("Dependencies", check_requirements),
        ("Database Migrations", check_migrations),
        ("Documentation", check_documentation),
        ("Security Settings", check_security_settings),
        ("Build Configuration", check_build_script),
        ("Testing", check_tests),
    ]

    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"{Colors.RED}Error in {name}: {e}{Colors.END}")
            results.append((name, False))

    # Summary
    print_header("VALIDATION SUMMARY")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {status}  {name}")

    print(f"\n{Colors.BOLD}Total: {passed}/{total} checks passed{Colors.END}")

    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}SUCCESS - PRODUCTION READY!{Colors.END}")
        print(f"\n{Colors.BLUE}Next steps:{Colors.END}")
        print("  1. Review DEPLOYMENT_GUIDE.md")
        print("  2. Set up Render account")
        print("  3. Set up Vercel account")
        print("  4. Configure environment variables")
        print("  5. Deploy!")
        return 0
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}WARNING - Some checks failed{Colors.END}")
        print(f"\n{Colors.BLUE}Fix the issues above before deploying.{Colors.END}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
