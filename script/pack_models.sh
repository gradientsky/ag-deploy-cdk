#!/bin/sh

MODEL_FILE=model.tar.gz

echo '==--------RemoveOldModelDir---------=='
if [ -f "model/deploy/$MODEL_FILE" ]; then
    rm -r model/deploy/$MODEL_FILE
fi

echo '==--------PackNewModel---------=='
if [ -f "model/temp" ]; then
    rm -rf model/temp
fi
mkdir model/temp
cd model/temp
cp -r ../src/code .
cp -r ../src/model/ .

tar -zcvf $MODEL_FILE ./*

echo '==--------MoveIntoModelDir---------=='
mv $MODEL_FILE ../deploy/
cd ..
rm -rf temp
