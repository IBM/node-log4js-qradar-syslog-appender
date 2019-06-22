# See bash(1)
set -o pipefail

SUBFOLDERS=( "system" )

# Track whether there has been a test failure.  Should only
# be set to the word "true" or the word "false".
#
isTestRunSuccessful=true

for SUBFOLDER in "${SUBFOLDERS[@]}"
do
  for file in tests/$SUBFOLDER/*.js
  do   
    filename="${file##*/}"
    echo "$file:"
    [ -f "$file" ] && node_modules/.bin/tape "${file}" | node_modules/.bin/tap-spec 
    if [ $? -ne 0 ] ; then
      isTestRunSuccessful=false
    fi
  done
done

# It is important that this is either set to the word true
# or the word false.
#
if $isTestRunSuccessful; then
  exit 0
else
  echo "One or more tests failed. Failing suite."
  exit 1
fi
