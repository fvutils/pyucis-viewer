
import os
from setuptools import setup

setup(
  name = "pyucis-viewer",
  packages=['pyucis-viewer'],
  package_dir = {'' : 'src'},
  author = "Matthew Ballance",
  author_email = "matt.ballance@gmail.com",
  description = ("PyUCIS Viewer QT5-based viewer for UCIS data."),
  license = "Apache 2.0",
  keywords = ["SystemVerilog", "Verilog", "RTL", "Coverage"],
  url = "https://github.com/fvutils/pyucis-viewer",
  entry_points={
    'console_scripts': [
      'pyucis-viewer = pyucis-viewer.__main__:main'
    ]
  },
  setup_requires=[
    'setuptools_scm',
  ],
  install_requires=[
  ],
)

