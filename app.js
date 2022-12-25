const {
	app,
	BrowserWindow,
	screen,
	ipcMain,
	session,
	desktopCapturer
} = require("electron");
const path = require("path");
const fs = require("fs");
const conf = require("./config.json");

let childWin = {};
let mainWin = null;
let dataWin = {};

const createWindow = (params) => {
	var conf = {
		minWidth: 940,
		minHeight: 560,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		icon: __dirname+"/favicon.png"
	};

	if (params.frame) conf.frame = params.frame;
	if (params.autoHideMenuBar) conf.autoHideMenuBar = params.autoHideMenuBar;
	if (params.nodeIntegration) conf.webPreferences.nodeIntegration = params.nodeIntegration;
	if (params.nativeWindowOpen) conf.webPreferences.nativeWindowOpen = params.nativeWindowOpen;
	if (params.contextIsolation) conf.webPreferences.contextIsolation = params.contextIsolation;
	if (params.preload) conf.webPreferences.preload = path.join(__dirname, params.preload);
	if (params.width) conf.minWidth = params.width;
	if (params.width) conf.width = params.width;
	if (params.height) conf.minHeight = params.height;
	if (params.height) conf.height = params.height;
	if (params.resizable != null) conf.resizable = params.resizable;
	if (params.x != null) conf.x = params.x;
	if (params.y != null) conf.y = params.y;

	const win = new BrowserWindow(conf);

	if (params.type == "file") win.loadFile(params.target);
	if (params.type == "url") {
		if (params.userAgent) {
			win.loadURL(params.target, {userAgent: params.userAgent});
		}else{
			win.loadURL(params.target);
		}
	}
	return win;
};

const win = {
    createChild: (params) => {
        var id = params.account.username;
        if(!childWin[id]) {
            var configWin = {
                frame: true,
                type: "url",
                target: conf.urlBank,
                preload: "bca.js",
                resizable: true,
                autoHideMenuBar: true,
            }
            
            childWin[id] = createWindow(configWin);
            childWin[id].webContents.send("data", params);
            dataWin[id] = params;
            childWin[id].once("close", () => {
                childWin[id].close();
                delete childWin[id];
            })
        }
    },
    close: (params) => {
        if (!params.child) {
			Object.keys(childWin).forEach(e => {
				if (childWin[e]) {
					childWin[e].close();
					delete childWin[e];
				}
			});
            mainWin.close();
		}else{
			if (childWin[params.id]) {
				childWin[params.id].close();
				delete childWin[params.id];
			}
		}
    },
    minimize: (params) => {
        if(params.child) {
            if (childWin[params.id]) childWin[params.id].minimize();
        }else{
            mainWin.minimize();
        }
    },
    maximizeRestore: (params) => {
        if (params.child) {
            if (childWin[params.id]) {
                childWin[params.id].isMaximized() ? childWin[params.id].restore() : childWin[params.id].maximize()
            }
        }else{
            mainWin.isMaximized() ? mainWin.restore() : mainWin.maximize()
        }
    },
}

ipcMain.on("win:create", (event, params) => win.createChild(params));
ipcMain.on("win:close", (event, params) => win.close(params));
ipcMain.on("win:minimize", (event, params) => win.minimize(params));
ipcMain.on("win:maximizeRestore", (event, params) => win.maximizeRestore(params));

ipcMain.on("config", (event) => event.returnValue = conf);
ipcMain.on("update:data", (event, params) => mainWin.webContents.send("update:data", params));

ipcMain.on("errorProses", (event, params) => {
    win.close({
        child: true,
        id: params.data.account.username,
    });
    mainWin.webContents.send("update:data", {
        id: params.data.id,
        data: params.message
    })
})

app.whenReady().then(async () => {
    mainWin = createWindow({
        type: "file",
        target: path.join(__dirname, "main.html"),
    });
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});