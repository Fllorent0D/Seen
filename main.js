const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain;
const fs    = require('fs'),
    nconf = require('nconf');
const path = require('path')
const url = require('url')
const Trakt = require("trakt.tv");
const moment = require("moment");
const trakt = new Trakt({
    client_id: '0c62001e900d72ce462cd6a9f07765f9e44010675f4b5a97da593cbdfe6bf060',
    client_secret: '39d47a3536a2eca9890e8c6fe14a744b4b8274c9d4389d7f3d6c3059d7eb1e52',
    redirect_uri: null,
    api_url: null
});
const didYouMean = require('didyoumean2');

nconf.file({ file: path.join(__dirname, 'token.json') });
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, loginwindows

function createWindow () {
  // Create the browser window.
    mainWindow = new BrowserWindow({width:800, height:600});
    if(typeof nconf.get('TOKEN') !== 'undefined'){
        trakt.import_token(nconf.get("TOKEN")).then(newTokens => {
            console.log(newTokens);
            // Contains token, refreshed if needed (store it back)
        });
    }else{

        loginwindows = new BrowserWindow({width: 800, height: 600});
        const traktAuthUrl = trakt.get_url();
        loginwindows.loadURL(traktAuthUrl);

    }

    // and load the index.html of the app.

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
ipc.on("code", (event, arg) => {
    console.log(arg);

    trakt.exchange_code(arg).then(result => {
        nconf.set("TOKEN", trakt.export_token());
        nconf.save();
        console.log(result);
        loginwindows.destroy();
        // contains tokens & session information
        // API can now be used with authorized requests
    });
})
ipc.on("api", () => {
   trakt.sync.watched({
       type:"shows"
   }).then((result) => {
       let shows = [];
       console.log(result.length);
       for(let i = 0; i < result.length; i++){
           shows.push(result[i].show.title);
       }

       nconf.set("SHOWS", shows);

       nconf.set("SYNC", result);
       nconf.save();
       //console.log(result);
   }).catch((error) => {
       console.log(error)
   })
});
ipc.on("file", (event, arg)=>{
    let shows = nconf.get("SHOWS");
    let sync = nconf.get("SYNC");
    let cleanedTitle = path.basename(arg);
    var regEx = new RegExp("S([0-9]{1,2})E([0-9]{1,2})", "i");
    var match = cleanedTitle.match(regEx);
    let sai = match[1];
    let ep = match[2];
    cleanedTitle = cleanedTitle.substring(0, match.index);
    cleanedTitle = cleanedTitle.replace(new RegExp("((\\.|-|\\s)^)", 'g'), "");
    console.log(cleanedTitle);


    let found = didYouMean(cleanedTitle, shows, {
        returnType: 'all-closest-matches',
        trimSpace: false,
        thresholdType: 'edit-distance',
        threshold: Infinity
    });
    console.log(`Trouvé : ${found} Saison ${sai} Episode ${ep}`);
    let theShow;
    for(let i = 0; i < sync.length; i++)
    {
        if(sync[i].show.title == found){
            theShow = sync[i].show;
            break;
        }
    }

    console.log(theShow);
    let seasons = [{
        "number": sai,
        "episodes":[{
            "number": ep,
            "watched_at": "released"
        }]
    }];
    trakt.sync.history.add({
        movies : null,
        shows : theShow,
        seasons: seasons,
        episodes: null
    }).then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });

    /*


         {
             "title": "Mad Men",
             "year": 2007,
             "ids": {
                 "trakt": 4,
                 "slug": "mad-men",
                 "tvdb": 80337,
                 "imdb": "tt0804503",
                 "tmdb": 1104,
                 "tvrage": 16356
             },
             "seasons": [{
                 "number": 1,
                 "episodes": [
                 {
                    "watched_at": "2014-09-01T09:10:11.000Z",
                    "number": 1
                 }
                 ]
             }]
         }



     */

});

ipc.on("textSearch", (event, arg) => {
    let shows = nconf.get("SHOWS");
    let cleanedTitle = arg;

    /* V1
    let filetags = ["CAM","TELESYNC","TC" ,"TELECINE","DD5.1","H264","Blu-ray","HEVC","x265","Screener","iTunes","h.264","FASUB","VHSRip","R1","R2","R3","R4","R5","R6","DVDSCR","DVDSCR.MULTISTOLEN","DVDRip","DVD-R","DVD5","DVD9","BRRip","XViD","BDRip","BRRiP","BluRay","BD5","BD9","TVRip","SATRip","SDTV","DSR","DSRipDVB","DVBrip","PDTV","HVTV","LD.HDTV","HDTV","DVTV","DVD-TV","LD.DVDRip","720p","1080p","1080i","DVDRip","BDRip","BRRip","Bluray","WEBRip","WEB-DL","AAC(2(.)?0)?", "AAC","AC3","DD51","DL","DTS","HBO","MULTI","480i","480p","576i","576p","720p","1080i","1080i50","1080i60","1080p","COMPLETE","CUSTOM","DC","DiVX","DOC","EXTENDED","EXTENDED.CUT","FASTSUB","FESTiVAL","FiNAL","FRENCH","FS","FullScreen", "High Resolution","iND","iNTERNAL","ISO","LiMiTED","NTSC","PAL","PREAiR","PROPER","RATED","REAL","READ.NFO","READNFO","REMASTERED","REPACK","RERIP","RETAIL","H.264","SECAM","STV","SUBFORCED","FRENCHFORCED","THEATRICAL","TRUEFRENCH","UNCUT","UNRATED","VOSTFR","WORKPRINT","WP","WS","X264","XviD"]
    for(let i = 0; i < filetags.length; i++){
        var regEx = new RegExp(filetags[i], "ig");
        cleanedTitle = cleanedTitle.replace(regEx, "");
    }
    var regEx = new RegExp("S([0-9]{1,2})E([0-9]{1,2})");
    let epData = cleanedTitle.match(regEx);
    let ep = parseInt(epData[2]);
    let sai = parseInt(epData[1]);
    cleanedTitle = cleanedTitle.replace(regEx, "");
    console.log(cleanedTitle)

    cleanedTitle = cleanedTitle.replace(new RegExp("\\.+|-", 'g'), " ");
    console.log(cleanedTitle)
    */
    /* V2 */

    var regEx = new RegExp("S([0-9]{1,2})E([0-9]{1,2})", "i");
    var match = cleanedTitle.match(regEx);
    let sai = match[1];
    let ep = match[2];
    console.log(match);
    cleanedTitle = cleanedTitle.substring(0, match.index);
    cleanedTitle = cleanedTitle.replace(new RegExp("((\\.|-|\\s)^)", 'g'), "");
    console.log(cleanedTitle);


    let found = didYouMean(cleanedTitle, shows, {
        returnType: 'all-closest-matches',
        trimSpace: false,
        thresholdType: 'edit-distance',
        threshold: Infinity
    });
    console.log(`Trouvé : ${found} Saison ${sai} Episode ${ep}`);

})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.





