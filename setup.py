
import os
from setuptools import setup, find_namespace_packages

version="0.0.4"

if "BUILD_NUM" in os.environ.keys():
  version = version + "." + os.environ["BUILD_NUM"]


setup(
  name = "pyucis-viewer",
  version=version,
  packages=find_namespace_packages(where='src'),
  package_dir = {'' : 'src'},
  author = "Matthew Ballance",
  author_email = "matt.ballance@gmail.com",
  description = ("PyUCIS Viewer QT5-based viewer for UCIS data."),
  long_description = """
  Extremely simple graphical viewer for coverage data in a UCIS database
  """,
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
    'pyucis>=0.0.6'
  ],
)

