# Deploy FD ke VPS (Ubuntu 24.04) - SSL Gratis, Tanpa Docker

## Perlu Docker? TIDAK.

Bun itu satu file binary, install-nya satu perintah curl.
Workflow CD di repo ini (cd.yml) memang dirancang jalan native:
git pull -> bun install -> build -> systemctl restart.
Docker cuma nambah kerumitan (volume buat SQLite, RAM kepakai lebih)
tanpa manfaat di setup ini.
Docker baru masuk akal nanti kalau satu VPS jalanin banyak service
dengan dependency yang bentrok.

**SSL gratis? YA.** Let's Encrypt via `certbot --nginx` — gratis,
auto-renew sendiri. Total biaya: **Rp0**.

Contoh pakai `fd.sir-l.web.id` — ganti dengan subdomain pilihanmu.
Panduan ini selaras dengan `.github/workflows/cd.yml`: setelah selesai,
**setiap push ke `main` auto-deploy sendiri**.

## 0. DNS dulu

Buat A record `fd.sir-l.web.id -> 103.127.139.5`, tunggu propagasi
(5-15 menit). Cek: `nslookup fd.sir-l.web.id` harus jawab IP itu.
Tanpa ini certbot gagal verifikasi.

## 1. Install Bun di VPS

SSH sebagai `newgabungan`, lalu jalankan installer resmi Bun:

```bash
curl -fsSL https://bun.sh/install | bash
sudo ln -s ~/.bun/bin/bun /usr/local/bin/bun
bun --version
```

Symlink ke `/usr/local/bin` penting supaya `bun` ketemu saat
GitHub Actions SSH non-interaktif (PATH-nya minimal).

## 2. Clone repo

```bash
sudo mkdir -p /opt
sudo git clone https://github.com/itzluthfi/fd-digital-printing.git /opt/fd-digital-printing
sudo chown -R newgabungan:newgabungan /opt/fd-digital-printing
```

Kenapa `/opt` bukan `/var/www`? Karena `cd.yml` hardcode path
`/opt/fd-digital-printing`. Kalau beda, auto-deploy-nya patah.
## 3. File `.env` produksi

```bash
cd /opt/fd-digital-printing
cp .env.example .env
nano .env
```

Isi yang wajib:

```
BETTER_AUTH_SECRET=<hasil perintah openssl di bawah>
BETTER_AUTH_URL=https://fd.sir-l.web.id
TRUSTED_ORIGINS=https://fd.sir-l.web.id
```

Generate secret: `openssl rand -base64 32`

Catatan:

- `BETTER_AUTH_URL` **wajib https + domain asli** — kalau masih
  `http://localhost:5173`, cookie login rusak di production.
- `TRUSTED_ORIGINS` wajib diisi — SvelteKit di belakang nginx hanya melihat
  HTTP biasa; tanpa ini semua form action kena blokir CSRF (403).
  (Lihat `vite.config.ts`: daftar ini dibaca dari env tersebut.)
- Token lain (Telegram, Resend, WA, AI gateway) opsional — isi belakangan,
  app tetap jalan tanpanya.
- `.env` **tidak pernah di-commit** (sudah di `.gitignore`).

## 4. Install, database, owner, build

```bash
cd /opt/fd-digital-printing
bun install
bun run db:push
bun run db:seed:owner -- "owner@toko.id" "GANTI_DENGAN_PASSWORD_KUAT"
bun run build
```

- `db:push` bikin skema SQLite di `./data/app.db`.
- `db:seed:owner` bikin satu akun owner. **JANGAN** jalankan `db:seed`
  di VPS — itu data dummy 12 order buat demo lokal.
- `build` menghasilkan `build/index.js` (adapter-node, lihat `vite.config.ts`).
## 5. systemd — jalan 24/7 + auto-restart

Buat file `/etc/systemd/system/fd-printing.service`:

```ini
[Unit]
Description=FD Digital Printing
After=network.target

[Service]
Type=simple
User=newgabungan
WorkingDirectory=/opt/fd-digital-printing
EnvironmentFile=/opt/fd-digital-printing/.env
Environment=PORT=3000
ExecStart=/usr/local/bin/bun ./build/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fd-printing
sudo systemctl status fd-printing --no-pager | head -12
```

Tes app sudah jawab (ganti contoh bila perlu):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000
# harus keluar 200 (atau 302 redirect ke /sign-in) -> app jalan
```

## 6. nginx + SSL gratis (Let's Encrypt)

Kalau nginx belum ada: `sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx`.
Di VPS ini kemungkinan nginx sudah ada (folder `/var/www` sudah terisi) —
cek dulu `nginx -v`.

Buat `/etc/nginx/sites-available/fd-printing`:

```nginx
server {
    listen 80;
    server_name fd.sir-l.web.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fd-printing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d fd.sir-l.web.id
```

Pilih opsi redirect saat ditanya — semua HTTP -> HTTPS.
Certbot memasang systemd timer sendiri untuk auto-renew; cek:
`systemctl list-timers | grep certbot`.

Verifikasi: buka `https://fd.sir-l.web.id` -> gembok hijau, login owner bisa.

## 7. Firewall (hati-hati)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> Kalau SSH VPS-mu bukan port 22, allow port itu DULU sebelum
> `ufw enable`, kalau tidak kamu kekunci di luar.
## 8. Kunci SSH khusus untuk auto-deploy

Di **laptop kamu** (bukan VPS) — bikin kunci baru khusus deploy,
jangan pakai kunci pribadi yang sudah ada:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/fd-deploy -C "fd-github-actions" -N ""
cat ~/.ssh/fd-deploy.pub
```

Di **VPS** (sebagai `newgabungan`), daftarkan public key-nya:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Tempel isi `fd-deploy.pub` di baris baru `authorized_keys`.

Workflow CD menjalankan `sudo systemctl restart fd-printing` — beri izin
tanpa password HANYA untuk perintah itu:

```bash
echo "newgabungan ALL=(ALL) NOPASSWD: /bin/systemctl restart fd-printing" | sudo tee /etc/sudoers.d/fd-deploy
sudo chmod 440 /etc/sudoers.d/fd-deploy
sudo visudo -c
```

Terakhir siapkan folder backup sekali saja:

```bash
sudo mkdir -p /backup/fd && sudo chown newgabungan:newgabungan /backup/fd
```

## 9. Aktifkan CD di GitHub

Repo GitHub -> **Settings -> Secrets and variables -> Actions ->
New repository secret**, isi 3 secret:

| Secret            | Isi                                    |
| ----------------- | -------------------------------------- |
| `SSH_HOST`        | `103.127.139.5`                        |
| `SSH_USER`        | `newgabungan`                          |
| `SSH_PRIVATE_KEY` | isi file `~/.ssh/fd-deploy` (private!) |

Setelah itu tiap `git push` ke `main`: GitHub Actions SSH ke VPS ->
backup `data/app.db` -> `git pull` -> `bun install` -> `db:push` ->
`build` -> `restart fd-printing`. 1-2 menit, pantau di tab Actions.

Tes: ubah satu baris teks -> commit -> push -> cek Actions hijau ->
buka situs, perubahannya live.

> Pola kerja: **semua perubahan lewat push ke `main`**. Jangan edit kode
> langsung di `/opt/fd-digital-printing` — ketimpa `git pull` berikutnya.
> Database dan `.env` hidup di server, tidak ikut push/pull.

## 10. Cron: reminder piutang + backup

```bash
crontab -e
```

```
CRON_TZ=Asia/Jakarta
0 7 * * * cd /opt/fd-digital-printing && /usr/local/bin/bun run reminder >> /var/log/fd-reminder.log 2>&1
0 2 * * * cp /opt/fd-digital-printing/data/app.db /backup/fd/app-$(date +\%F).db
```

## 11. Webhook Telegram

Setelah HTTPS live, daftarkan webhook sekali saja — caranya sudah ada di
README bagian Production langkah 4 (perintah `setWebhook` ke Bot API).

## Troubleshooting

| Gejala | Penyebab umum |
| ------ | ------------- |
| `certbot` gagal | DNS belum propagasi / port 80 ketutup firewall |
| Form submit 403 | `TRUSTED_ORIGINS` belum diisi domain https |
| Login langsung logout | `BETTER_AUTH_URL` masih localhost |
| CD hijau tapi situs tidak berubah | `sudo systemctl restart` minta password -> cek langkah 8 |
| `bun: command not found` di CD | symlink `/usr/local/bin/bun` belum dibuat (langkah 1) |
