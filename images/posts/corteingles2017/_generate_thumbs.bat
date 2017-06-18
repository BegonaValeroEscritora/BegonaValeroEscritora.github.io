mkdir thumbs
mogrify  -format jpg -quality 75 -path thumbs -thumbnail 600x400 *.jpg
pause