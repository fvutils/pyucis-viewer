
import os
from setuptools import setup, find_namespace_packages

def get_version():
    try:
        import ivpm
        return ivpm.get_pkg_version(__file__)
    except:
        return "0.0.0"

setup(
  name = "pyucis-viewer",
  packages=find_namespace_packages(where='src'),
  package_dir = {'' : 'src'},
  author = "Matthew Ballance",
  author_email = "matt.ballance@gmail.com",
  description = ("PyUCIS Viewer QT5-based viewer for UCIS data."),
  license = "Apache 2.0",
  keywords = ["SystemVerilog", "Verilog", "RTL", "Coverage"],
  url = "https://github.com/fvutils/pyucis-viewer",
  entry_points={
    'console_scripts': [
      'pyucis-viewer = pyucis_viewer.__main__:main'
    ]
  },
  setup_requires=[
    'setuptools_scm',
    'ivpm'
  ],
  install_requires=[
    'pyqt5',
    'pyucis'
  ],
)

