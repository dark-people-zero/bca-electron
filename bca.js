const { ipcRenderer } = require('electron');
const ipc = ipcRenderer;
const moment = require("moment");

var data = localStorage.getItem("data") ? JSON.parse(localStorage.getItem("data")) : localStorage.getItem("data");
ipc.on("data", (event, params) => {
    data = params,
    localStorage.setItem("data", JSON.stringify(params));
});

window.alert = (message) => ipc.send("errorProses", {data: data, message: message});

document.addEventListener("DOMContentLoaded", async function() {
    if(checkHalaman.login()) {
        console.log("di halaman login");
        if (data.data) {
            ipc.send("win:close", {
                child: true,
                id: data.account.username
            })
        }else{
            func.input();
        }
    }else if(checkHalaman.home()) {
        console.log("di halaman home");
        if (data.type == "saldo") {
            func.saldo();
        }else if (data.type == "mutasi") {
            func.mutasi();
        }else{
            console.log("gak tau di halaman mana");
        }
    }else{
        console.log("halaman tidak di ketahui");
    }
})

const checkHalaman = {
    login: () => {
        return document.body.textContent.includes("Registrasi Internet melalui ATM BCA");
    },
    home: () => {
        return document.querySelectorAll("frame").length > 0 ? true : false;
    }
}

const func = {
    input: () => {
        setTimeout(() => {
            document.getElementById("user_id").value = data.account.username;
            setTimeout(() => {
                document.getElementById("pswd").value = data.account.password;
                setTimeout(() => {
                    document.querySelector('input[value="LOGIN"]').click();
                }, 1000);
            }, 1000);
        }, 1000);
        

    },
    saldo: () => {
        var menu = document.querySelector('frame[name="menu"]');
        var atm = document.querySelector('frame[name="atm"]');
        setTimeout(() => {
            console.log("click informasi account");
            menu.contentWindow.document.querySelector('a[href="account_information_menu.htm"]').click();
            setTimeout(() => {
                console.log("click informasi saldo");
                menu.contentWindow.document.querySelector(`a[onclick="javascript:goToPage('balanceinquiry.do');return false;"]`).click();
                var check = 0;
                var int = setInterval(() => {
                    check += 1;
                    if (check > 10) clearTimeout(int);
                    if(atm.contentWindow.document.body.textContent.includes('INFORMASI REKENING - INFORMASI SALDO')) {
                        console.log("Proses saldo");
                        var html = atm.contentWindow.document.body.outerHTML;
                        data.data = html;
                        localStorage.setItem("data", JSON.stringify(data));
                        ipc.send("update:data", {
                            id: data.id,
                            data: html
                        });

                        func.logout();
                    }else{
                        console.log("rekening belum di temuin ke => ", check);
                        if (check > 10) func.logout();
                    }
                }, 1000);
            }, 3000);
        }, 3000);
    },
    mutasi: () => {
        var menu = document.querySelector('frame[name="menu"]');
        var atm = document.querySelector('frame[name="atm"]');
        const start = func.convertDate(data.date_start);
        const end = func.convertDate(data.date_end);
        setTimeout(() => {
            console.log("click informasi account");
            menu.contentWindow.document.querySelector('a[href="account_information_menu.htm"]').click();
            setTimeout(() => {
                console.log("click informasi saldo");
                menu.contentWindow.document.querySelector(`a[onclick="javascript:goToPage('accountstmt.do?value(actions)=acct_stmt');return false;"]`).click();
                var check = 0;
                var int = setInterval(() => {
                    check += 1;
                    if (check > 10) clearTimeout(int);
                    if(atm.contentWindow.document.body.textContent.includes('INFORMASI REKENING - MUTASI REKENING')) {
                        console.log("Proses mutasi");
                        atm.contentWindow.document.querySelector("#startDt").value = start.d;
                        atm.contentWindow.document.querySelector("#startMt").value = start.m;
                        atm.contentWindow.document.querySelector("#startYr").value = start.y;

                        atm.contentWindow.document.querySelector("#endDt").value = end.d;
                        atm.contentWindow.document.querySelector("#endMt").value = end.m;
                        atm.contentWindow.document.querySelector("#endYr").value = end.y;

                        atm.contentWindow.document.querySelector('input[value="Lihat Mutasi Rekening"]').click();

                        var check2 = 0;
                        var int2 = setInterval(() => {
                            check2 += 1;
                            if(check2 > 0) clearInterval(int2);
                            if (atm.contentWindow.document.body.textContent.includes('Nomor Rekening')) {
                                var html = atm.contentWindow.document.body.outerHTML;
                                data.data = html;
                                localStorage.setItem("data", JSON.stringify(data));
                                ipc.send("update:data", {
                                    id: data.id,
                                    data: html
                                });

                                func.logout();
                            }else{
                                console.log("nunggu get data mutasi ke => ", check);
                                if (check2 > 10) func.logout();
                            }
                        }, 1000);
                    }else{
                        console.log("rekening belum di temuin ke => ", check);
                        if (check > 10) func.logout();
                    }
                }, 1000);
            }, 3000);
        }, 3000);
    },
    logout: () => {
        var header = document.querySelector('frame[name="header"]');
        var btnLogout = header.contentWindow.document.querySelector(`a[onclick="javascript:goToPage('authentication.do?value(actions)=logout');return false;"]`);
        if (btnLogout) btnLogout.click();
    },
    convertDate: (date) => {
        var x = moment(date);
        const convertTwoDigits = (d) => {
            if (d.toString().length == 1) n = "0"+d;
            return d.toString();
        }

        return {
            y: convertTwoDigits(x.year()),
            m: convertTwoDigits(x.month()+1),
            d: convertTwoDigits(x.date()),
        }
    }
}