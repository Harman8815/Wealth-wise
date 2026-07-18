# WealthWise backend test command surface.
# Usage: make <target>  (run from the Backend/ directory)

PYTHON := venv/Scripts/python
PYTEST := $(PYTHON) -m pytest

.PHONY: test test-auth test-cov test-html test-allure ci

test:
	$(PYTEST)

test-auth:
	$(PYTEST) -m auth

test-cov:
	$(PYTEST) --cov=api --cov-report=html

test-html:
	$(PYTEST) --html=report.html

test-allure:
	$(PYTEST) --alluredir=allure-results

ci:
	$(PYTEST)
