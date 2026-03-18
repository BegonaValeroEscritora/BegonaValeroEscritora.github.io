mkdir thumbs
mogrify  -format jpg -quality 80 -thumbnail 1920x1200 *.jpg
mogrify  -format jpg -quality 80 -thumbnail 1920x1200 *.png
pause