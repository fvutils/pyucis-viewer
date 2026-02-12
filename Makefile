
ROOTDIR:=$(dir $(abspath $(lastword $(MAKEFILE_LIST))))

html :
	@$(ROOTDIR)/packages/python/bin/sphinx-build -M html \
		$(ROOTDIR)/doc/source $(ROOTDIR)/doc/build

.PHONY: test-python-build
test-python-build:
	cd $(ROOTDIR)/python && $(ROOTDIR)/packages/python/bin/python3 setup.py bdist_wheel --universal
