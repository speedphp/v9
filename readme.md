# v9 

Capture the nine screenshots for video throught the torrent or magnetURI, without download.

"再也不怕下载到葫芦娃了"

## Prerequisites

~~v9 base on the ffmpeg, so you must install ffmpeg on your machine.~~
~~AND the PATH must be set for the ffmpeg and ffprobe.~~
Now there is no need to install ffmpeg first, v9 uses ```ffmpeg-installer``` and ```ffprobe-installer``` to setup these commands, no further installation work required.

## How to install

```
npm install v9 -g
```

v9 must be installed on -g, by globals.

##   Usage: 
```
$ v9 [options] <magnetURI>
```

  Capture the nine screenshots for video in the magnetURI or torrent, without download.

  Options:

    -V, --version       output the version number
    -d, --dir <string>  The output directory
    -h, --help          output usage information

  Examples:

    $ v9 magnet:?xt=urn:btih:xxx
    $ v9 -d D:\output magnet:?xt=urn:btih:xxx
    $ v9 D:\v9\video.torrent