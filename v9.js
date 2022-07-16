#!/usr/bin/env node

require('events').EventEmitter.defaultMaxListeners = 0;
var WebTorrent = require("webtorrent")
var program = require('commander');
var path = require("path");
var ffprobeInstaller = require('@ffprobe-installer/ffprobe');
var ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

var client = new WebTorrent()
var filter = ["mp4", "rm", "rmvb", "avi", "mkv", "wmv"]
var mapkey = 1;
var logger = require('tracer').console({
    format: "[{{title}}] {{timestamp}} {{message}}",
    dateformat: "HH:MM:ss",
    preprocess: function (data) {
        data.title = data.title.toUpperCase();
    }
});
program
    .version(require('./package.json').version)
    .description(require('./package.json').description)
    .option('-d, --dir <string>', 'The output directory', process.cwd())
    .arguments('<magnetURI>')
    .action(function (magnetURI) {
        infile = magnetURI
    });

program.on('--help', function () {
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log("    $ v9 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c'");
    console.log('    $ v9 -d ' + process.cwd() + " 'magnet:?xt=urn:btih:209c8226b299b308beaf2b9cd3fb49212dbd13ec'");
    console.log('    $ v9 ' + process.cwd() + path.sep + 'free_torrents' + path.sep + 'sintel.torrent');
});
program.parse(process.argv);

if (typeof infile === 'undefined') program.help();

var torrentId;
var outputDir = program.opts().dir;
if( 0 === infile.indexOf("magnet")){
    torrentId = infile
}else{
    torrentId = path.resolve(infile)
}

logger.info("Starting, please wait...")
client.add(torrentId, function (torrent) {
    var server = torrent.createServer()
    server.listen(3003)
    logger.info("Torrent checked OK...")
    process.on('SIGINT', function () {
        console.log('Got a SIGINT. Ready to exit, Bye!');
        server.close();
        client.destroy();
        process.exit(0);
    });

    var exists_media = false;
    var files = [];
	var total = 0;
    for (var key in torrent.files) {
        var filename = torrent.files[key].name;
        var suffix = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        if (filter.indexOf(suffix) != -1) {
            exists_media = true;
            logger.info("Found media: " + (torrent.files[key].length / 1024 /1024).toFixed(2) + "MB; " + filename)
            files.push({
                "filename": filename,
                "suffix": suffix,
                "key": key
            })
			total += 9;
        }
    }
    if (!exists_media) {
        logger.warn("Torrent contains not media!")
        server.close()
        client.destroy()
    } else {
        var async_map = require("async/map");
        async_map(files, function (file, callback) {
            var url = "http://127.0.0.1:3003/" + file.key + "/" + encodeURIComponent(file.filename)
            var ffprobe_cmd = ffprobeInstaller.path + " -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " + url
            const exec = require('child_process').exec;
            (function (ffprobe_cmd, filename, key, suffix, url) {
                exec(ffprobe_cmd, function (err, stdout, stderr) {
                    if (err) {
                        logger.error(err);
                        return;
                    }
                    var duration = parseInt(stdout)
                    var step = (parseInt(duration) - 20) / 8;
                    var cmds = [];
                    for (var i = 5; i < duration; i += step) {
                        i = parseInt(i)
                        var btime = formatTime(i)
                        var filepath = outputDir + path.sep + (1 + parseInt(key)) + "-" + suffix + "-" + btime + ".jpg"
                        var ffmpeg_cmd = ffmpegInstaller.path + ' -ss ' + i + ' -i "' + url + '" -t 10 -filter_complex "select=eq(pict_type\\,I)[out];[out]scale=-2:360" -f image2 -vframes 1 -an -y ' + filepath
                        cmds.push(ffmpeg_cmd)
                    }
                    async_map(cmds, function (cmd, callback) {
                        exec(cmd, function (err, stdout, stderr) {
                            logger.info("Got " + mapkey++ + " screenshot, total is " + total + ", continue...")
                            callback(err, stdout)
                        })
                    }, function (err, results) {
                        if (err) {
                            logger.error(err)
                        }
                        logger.info("Completed the file " + filename)
                        callback(err, results)
                    });
                });
            })(ffprobe_cmd, file.filename, file.key, file.suffix, url);
        }, function (err, results) {
            if (err) {
                logger.error(err)
            }
            console.log("")
            logger.info("Finished capture " + total + " screenshot! ")
            logger.info("Please check the output directory '" + outputDir + "' to see the screenshots. Bye!")
            server.close()
            client.destroy()
        })
    }
})

function formatTime(second) {
    return [parseInt(second / 60 / 60), parseInt(second / 60 % 60), parseInt(second % 60)].join(".")
        .replace(/\b(\d)\b/g, "0$1");
}