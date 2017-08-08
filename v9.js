#!/usr/bin/env node

require('events').EventEmitter.defaultMaxListeners = 0;
var WebTorrent = require("webtorrent")
var program = require('commander');
var path = require("path");
var client = new WebTorrent()
var filter = ["mp4", "rm", "rmvb", "avi", "mkv"]
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
    .option('-i, --infile <string>', 'Must be a torrent file location or a magnetURI')
    .option('-d, --dir <string>', 'The output directory', process.cwd());
program.on('--help', function () {
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('    $ v9 -i magnet:?xt=urn:btih:xxx');
    console.log('    $ v9 -i ' + process.cwd() + path.sep + 'video.torrent -d ' + process.cwd());
});
program.parse(process.argv);
if (!program.infile) {
    program.outputHelp();
    process.exit();
}
var torrentId;
var outputDir = program.dir;
if( 0 === program.infile.indexOf("magnet")){
    torrentId = program.infile
}else{
    torrentId = path.resolve(program.infile)
}
process.stdout.write('\033c');
logger.info("Starting, please wait...")
client.add(torrentId, function (torrent) {
    process.stdout.write('\033c');
    var server = torrent.createServer()
    server.listen(3003)
    logger.info("Torrent checked OK...")
    var exists_media = false;
    var files = [];
	var total = 0;
    for (key in torrent.files) {
        filename = torrent.files[key].name;
        suffix = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        if (filter.indexOf(suffix) != -1) {
            exists_media = true;
            logger.info("Found media:" + filename)
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
            ffprobe_cmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " + url
            const exec = require('child_process').exec;
            (function (filename, key, suffix, url) {
                exec(ffprobe_cmd, function (err, stdout, stderr) {
                    if (err) {
                        logger.error(err);
                        return;
                    }
                    duration = parseInt(stdout)
                    step = (parseInt(duration) - 20) / 8;
                    var cmds = [];
                    for (var i = 5; i < duration; i += step) {
                        i = parseInt(i)
                        btime = formatTime(i)
                        filepath = outputDir + path.sep + (1 + parseInt(key)) + "-" + suffix + "-" + btime + ".jpg"
                        ffmpeg_cmd = 'ffmpeg -ss ' + i + ' -i "' + url + '" -t 10 -filter_complex "select=eq(pict_type\\,I)[out];[out]scale=-2:360" -f image2 -vframes 1 -an -y ' + filepath
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
            })(file.filename, file.key, file.suffix, url);
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