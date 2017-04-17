mkdir thumbs
mogrify  -format jpg -quality 75 -path thumbs -thumbnail 800x800 *.jpg
mogrify  -format jpg -quality 75 -path thumbs -thumbnail 800x800 *.png
pause