##!/usr/bin/env bash
## exit on error
#set -o errexit
#
#export PUPPETEER_CACHE_DIR="$HOME/.cache/puppeteer"
#export XDG_CACHE_HOME="$HOME/.cache"
#
#echo $PUPPETEER_CACHE_DIR
#echo $XDG_CACHE_HOME
#
#npm install
#
#if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
#  echo "...Creating Puppeteer Cache Directory"
#  mkdir -p $PUPPETEER_CACHE_DIR
#  echo "...Puppeteer Cache Directory Created"
#else
#  echo "...Puppeteer Cache Directory Already Exists"
#fi