@echo off
color 17
echo This .bat searches in any text file in any directory under this folder.
set /P words= Enter words to search: 
set /P extension= Enter extension (.txt, .vhd...) or enter for any: 
@echo on
findstr /s /C:"%words%" *%extension%
@echo off
pause