const electron = require('electron')
const app = electron.app
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
let mainWindow, loginwindows

function createWindow () {
    mainWindow = new BrowserWindow({width:800, height:600, maxWidth:992, show:false, titleBarStyle: "hidden-inset"});//
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/renderer/index_mat.html'),
        protocol: 'file:',
        slashes: true
    }));

  mainWindow.on('closed', function () {
    mainWindow = null
  })
  mainWindow.once("ready-to-show", ()=>{
    mainWindow.show();
    if(typeof nconf.get('TOKEN') !== 'undefined'){
        trakt.import_token(nconf.get("TOKEN")).then(newTokens => {
            console.log(newTokens);
            mainWindow.webContents.send("feedback", {text:"Already logged in"});

            // Contains token, refreshed if needed (store it back)
        });
    }
  })


}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
ipc.on("code", (event, arg) => {
    console.log(arg);

    trakt.exchange_code(arg).then(result => {
        nconf.set("TOKEN", trakt.export_token());
        nconf.save();
        mainWindow.webContents.send("feedback", {text: "Connected to Trakt"});

        loginwindows.destroy();
        setTimeout(() => {
          syncShows();
        }, 2000)
    });
})
let syncShows = () => {
   mainWindow.webContents.send("feedback", {text: "Show sync started..."});

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
       setTimeout(()=>{
         mainWindow.webContents.send("feedback", {text: "Show sync finished"});

       }, 2000)

       //console.log(result);
   }).catch((error) => {
      mainWindow.webContents.send("feedback", {text: "Show sync failed"});

       console.log(error)
   }).then(() => {

   })
};
ipc.on("postToTrakt", (event, arg) => {
  let serie, saison, ep;
  serie = arg.show;
  saison = arg.saison;
  ep = arg.ep;
  let shows = nconf.get("SHOWS");
  let sync = nconf.get("SYNC");

  for(let i = 0; i < sync.length; i++)
  {
      if(sync[i].show.title == serie){
          theShow = sync[i].show;
          break;
      }
  }

  console.log(theShow);
  let seasons = [{
      "number": saison,
      "episodes":[{
          "number": ep,
          "watched_at": "released"
      }]
  }];
  mainWindow.webContents.send("feedback", {text: "Sending to Trakt..."});

  trakt.sync.history.add({
      movies : null,
      shows : [theShow],
      seasons: seasons,
      episodes: null
  }).then((result) => {
      event.sender.send("feedback",{text: "Saved on Trakt!"})
  }).catch((err) => {
      event.sender.send("feedback",{text:`Error : ${err.message}`})
  });
});
ipc.on("file", (event, arg)=>{
    let shows = nconf.get("SHOWS");
    let sync = nconf.get("SYNC");
    try {
      let cleanedTitle = path.basename(arg);
      var regEx = new RegExp("S([0-9]{1,2})E([0-9]{1,2})", "i");
      var match = cleanedTitle.match(regEx);
      let sai = match[1];
      let ep = match[2];
      cleanedTitle = cleanedTitle.substring(0, match.index);
      cleanedTitle = cleanedTitle.replace(new RegExp("((\\.|-|\\s)^)", 'g'), "");

      let found = didYouMean(cleanedTitle, shows, {
          returnType: 'all-closest-matches',
          trimSpace: false,
          thresholdType: 'edit-distance',
          threshold: Infinity
      });
      mainWindow.webContents.send("found", found, sai, ep);

    } catch (e) {
      event.sender.send("feedback",{text:`Unable to find any show`})

    } finally {

    }

});
ipc.on("openLoginWindow", () => {
  loginwindows = new BrowserWindow({width: 500, height: 600});
  const traktAuthUrl = trakt.get_url();
  loginwindows.loadURL(traktAuthUrl);
})
