echo "> Started transpiling ES6"
echo ""
./node_modules/.bin/babel --plugins "transform-runtime" src --out-dir ./lib
echo ""
echo "> Completed transpiling ES6"
