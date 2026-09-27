#!/bin/zsh
# Mac version of _verprueba.bat: serve the site at http://localhost:4000
cd "${0:A:h}"
export PATH="/opt/homebrew/opt/ruby/bin:$(/opt/homebrew/opt/ruby/bin/gem environment gemdir)/bin:$PATH"
jekyll serve --host=localhost --port=4000
