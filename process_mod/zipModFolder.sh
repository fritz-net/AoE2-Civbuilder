#!/bin/bash

#arg1 = draft id (directory name)
#arg2 = make ui mod
#arg3 = custom zip filename (optional, without .zip extension)

# Use custom filename if provided, otherwise use draft id
ZIPNAME=${3:-$1}

# Sanitize ZIPNAME to prevent path traversal or invalid characters
# Only allow alphanumeric, dash, underscore, and dot
ZIPNAME=$(echo "$ZIPNAME" | sed 's/[^a-zA-Z0-9._-]/_/g')

if [[ $2 -eq 0 ]]
then
    rm -f ./modding/requested_mods/$ZIPNAME.zip
    cd ./modding/requested_mods/$1/$1-data
    zip -r ../$1-data.zip resources -qq
    cd ..
    mv ./$1-data/thumbnail.jpg ./thumbnail.jpg
    
    # Include JSON files if they exist
    JSON_FILES=""
    if [ -f ./data.json ]; then
        JSON_FILES="$JSON_FILES data.json"
    fi
    if [ -f ./draft-config.json ]; then
        JSON_FILES="$JSON_FILES draft-config.json"
    fi
    
    if [ -n "$JSON_FILES" ]; then
        zip ../$ZIPNAME.zip $1-data.zip thumbnail.jpg $JSON_FILES -qq
    else
        zip ../$ZIPNAME.zip $1-data.zip thumbnail.jpg -qq
    fi
    
    cd ..
    rm -r $1
    cd ..
    cd ..
else
    rm -f ./modding/requested_mods/$ZIPNAME.zip
    cd ./modding/requested_mods/$1/$1-data
    zip -r ../$1-data.zip resources -qq
    cd ..
    cd $1-ui
    zip -r ../$1-ui.zip resources widgetui -qq
    cd ..
    mv ./$1-ui/thumbnail.jpg ./thumbnail.jpg
    
    # Include JSON files if they exist
    JSON_FILES=""
    if [ -f ./data.json ]; then
        JSON_FILES="$JSON_FILES data.json"
    fi
    if [ -f ./draft-config.json ]; then
        JSON_FILES="$JSON_FILES draft-config.json"
    fi
    
    if [ -n "$JSON_FILES" ]; then
        zip ../$ZIPNAME.zip $1-data.zip $1-ui.zip thumbnail.jpg $JSON_FILES -qq
    else
        zip ../$ZIPNAME.zip $1-data.zip $1-ui.zip thumbnail.jpg -qq
    fi
    
    cd ..
    rm -r $1
    cd ..
    cd ..
fi


