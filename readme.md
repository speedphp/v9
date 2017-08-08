# v9 

Capture the nine picture for video throught the torrent or magnetURI, without download.

## Prerequisites

v9 base on the ffmpeg, so you must install ffmpeg on your machine.

AND the PATH must be set for the ffmpeg and ffprobe.

see more pleas visit: https://ffmpeg.org/download.html

## How to install

```
npm install v9 -g
```

v9 must be installed on -g, by globals.

##   Usage: 
```
$ v9 [options]
```

  Options:

    -V, --version          output the version number
    -i, --infile <string>  Must be a torrent file location or a magnetURI
    -d, --dir <string>     The output directory
    -h, --help             output usage information

  Examples:

    $ v9 -i magnet:?xt=urn:btih:xxx
    $ v9 -i D:\v9\test.torrent -d D:\v9