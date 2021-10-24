// module yang dibutuhkan
const express = require("express");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const fs = require("fs");
const crypto = require("crypto");
const jsonformat = require("json-format");

// express app
const app = express();

// setup
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
}));
app.use(flash());

// halaman pendaftaran
app.get("/pendaftaran", (request, response) => {
    response.render("pendaftaran", {
        title: "Halaman Pendaftaran",
        nomorHp: request.flash("msgNomorHpPendaftaran"),
        password: request.flash("msgPasswordPendaftaran"),
        gagal: request.flash("msgGagalPendaftaran"),
        namaLengkap: request.flash("msgNamaLengkapPendaftaran"),
    });
});

app.post("/pendaftaran", (request, response) => {
    let nomorHp = request.body.nomorHp;
    let namaLengkap = request.body.namaLengkap;
    let password = request.body.userPassword;

    if (namaLengkap.length < 3) {
        request.flash("msgNomorHpPendaftaran", nomorHp);
        request.flash("msgPasswordPendaftaran", password);
        request.flash("msgGagalPendaftaran", "Maaf pendaftaran gagal, Nama lengkap yang anda masukkan terlalu pendek");
        response.redirect("/pendaftaran");
        return;
    };

    if (password.length < 4) {
        request.flash("msgNomorHpPendaftaran", nomorHp);
        request.flash("msgNamaLengkapPendaftaran", namaLengkap);
        request.flash("msgGagalPendaftaran", "Maaf pendaftaran gagal, Password yang anda masukkan terlalu pendek");
        response.redirect("/pendaftaran");
        return;
    };

    if (nomorHp.length > 14 || nomorHp.length < 10 || !nomorHp.startsWith("08")) {
        request.flash("msgNamaLengkapPendaftaran", namaLengkap);
        request.flash("msgPasswordPendaftaran", password);
        request.flash("msgGagalPendaftaran", "Maaf pendaftaran gagal, Nomor telpon yang anda masukkan tidak valid");
        response.redirect("/pendaftaran");
        return;
    };

    let nohp = `databases/terdaftar/nohp.json`;
    const buffer = fs.readFileSync(nohp, 'utf-8');
    const data = JSON.parse(buffer);
    const dup = data.find((datanohp) => datanohp === nomorHp);

    if (dup) {
        request.flash("msgNamaLengkapPendaftaran", namaLengkap);
        request.flash("msgPasswordPendaftaran", password);
        request.flash("msgGagalPendaftaran", "Maaf pendaftaran gagal, Nomor telpon yang anda sudah terdaftar");
        response.redirect("/pendaftaran");
        return;
    }

    const time = new Date();
    let tanggal = time.getDate();
    let bulan = time.getMonth() + 1;
    let tahun = time.getFullYear();
    let jam = time.getHours();
    let menit = time.getMinutes();

    var string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    let result = "";
    for (var i = 0; i < 6; i++) {
        result += string.charAt(Math.floor(Math.random() * string.length));
    };

    let currentTime = `${tanggal}/${bulan}/${tahun} - ${jam}:${menit}`;
    let userid = result;
    let db = `databases/users/${userid}.json`;
    let object = {
        "userid": userid,
        "nomoHp": nomorHp,
        "namaLengkap": namaLengkap,
        "password": password,
        "tanggalPendaftaran": currentTime, 
    };
    if (fs.existsSync(db)) return response.redirect("/pendaftaran");
    fs.writeFile(db, JSON.stringify(object), 'utf-8', (err) => {
        if (err) return;
        const buffer = fs.readFileSync(nohp, 'utf-8');
        const datanohp = JSON.parse(buffer);
        datanohp.push(nomorHp);
        fs.writeFileSync(nohp, JSON.stringify(datanohp));
        request.flash("msgUserIdPendaftaran", userid);
        response.redirect("/pendaftaran-berhasil");
    });
});

app.get("/pendaftaran-berhasil", (request, response) => {
    response.render("pendaftaran_berhasil", {
        title: "Pendaftaran Berhasil",
        userid: request.flash("msgUserIdPendaftaran"),
    });
});

// listen
app.listen(process.env.PORT || 3000);
