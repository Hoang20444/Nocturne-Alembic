# 🚀 Hướng Dẫn Đăng & Kiếm Tiền Với **NOCTURNE ALEMBIC** Trên itch.io

Dự án **Nocturne Alembic** đã được thiết kế chuẩn thương mại cho **itch.io** (HTML5 WebGL/Canvas chạy trực tiếp trên trình duyệt + Cơ chế mở khóa **Supporter Edition** bằng mã Key).

---

## 1. File Đóng Gói Sẵn Sàng Đăng Lên itch.io

Ngay trong thư mục dự án `D:\MyP\Nocturne-Alembic`, bạn đã có sẵn file:
👉 **`nocturne-alembic-itch-web.zip`** *(được đóng gói từ thư mục `dist/` sau khi chạy `npm run build`)*.

Khi bạn chỉnh sửa code trong tương lai, chỉ cần chạy:
```powershell
npm run build
Compress-Archive -Path .\dist\* -DestinationPath .\nocturne-alembic-itch-web.zip -Force
```

---

## 2. Cấu Hình Trang Dự Án Trên itch.io (Từng Bước)

1. Truy cập [itch.io/game/new](https://itch.io/game/new) và đăng nhập tài khoản của bạn.
2. **Title:** `Nocturne Alembic — Cozy Midnight Alchemy & Peg Synthesis`
3. **Kind of project:** Chọn **`HTML`** (*You have a ZIP or HTML file that will be played in the browser*).
4. **Uploads:**
   - Bấm **Upload files** ➔ Chọn file `nocturne-alembic-itch-web.zip`.
   - Đánh dấu tích vào ô: ✅ **`This file will be played in the browser`**.
5. **Embed Options (Tùy chọn khung hiển thị):**
   - **Viewport dimensions:** Đặt **`1280` x `720`** (hoặc `1180` x `700`).
   - Đánh dấu tích:
     - ✅ **Mobile friendly**
     - ✅ **Automatically start on page load** (hoặc để nút Click to Play)
     - ✅ **Fullscreen button**
6. **Pricing (Cách bật kiếm tiền hiệu quả nhất):**
   - Chọn **`$0 or donate` (Pay What You Want)** với **Suggested donation: `$2.99`**.
   - **Cách bán Supporter Edition tự động:**
     - Tạo thêm 1 file `.txt` tên là `SUPPORTER_EDITION_KEY.txt` (bên trong ghi mã mở khóa: `ALCHEMIST-777`).
     - Tải file `SUPPORTER_EDITION_KEY.txt` lên mục Uploads và tích vào ô: ✅ **`Set a different price for this file`** ➔ Đặt giá tối thiểu **`$2.00`** (hoặc `$2.99`).
     - Như vậy: Người chơi miễn phí vẫn chơi được bản Web trên trình duyệt, và khi họ trả **từ $2.00 trở lên**, itch.io sẽ tự động cho họ tải file chứa mã **`ALCHEMIST-777`** để mở khóa **Chế độ Vô Tận (Endless Mode) + Bình Vàng Hoàng Gia + +500 Vàng & Tinh Linh Idle** ngay trong game!

---

## 3. Nội Dung Mô Tả Mẫu (Copy & Paste Vào Trang itch.io)

```markdown
# ⚗️ NOCTURNE ALEMBIC
*A Cozy Midnight Apothecary & Crystalline Peg-Alchemy Game*

Outside your rain-streaked window, sleepless townsfolk and strange nocturnal visitors knock with urgent requests. Inside your warm workshop stands the **Glass Alembic**—a resonant vessel studded with musical crystal pegs.

Drop elemental droplets from your pipette, listen to the pentatonic harp chimes as they cascade through crystal constellations, and synthesize rare elixirs through cross-element alchemical reactions!

### ✨ Key Features
* **Cross-Element Alchemical Synthesis:** Combine 4 base elements (*Aqua Vitae, Ignis Sulfur, Vitae Moss, Lunar Dust*) into **11 unique elixirs**—or fuse any two Tier-2 Elixirs to forge the legendary **Philosopher's Stone**!
* **Musical ASMR Physics:** Every crystal peg bounce plays a note on a harmonic pentatonic scale, accompanied by procedural midnight rain.
* **Midnight Visitors & Orders:** Brew potions for the *Sleepless Clockmaker*, *Bog Crow Familiar*, *Celestial Cartographer*, and more.
* **Upgrade Your Workbench:** Socket extra crystal pegs, polish crystal purity, forge high-bounce catalyst bumpers, and summon a **Homunculus Familiar** for cozy idle brewing!
* **Bilingual Support:** Instant **English / Tiếng Việt** toggle inside the game.

### 🎮 Controls
* **Mouse / Touch:** Move inside the vessel neck to aim, **Click / Tap** to drop an element. Click settled potions at the bottom (or press **Harvest**) to bottle them.
* **Keyboard:** Keys `1`–`4` to select elements, `A`/`D` or `Left`/`Right` Arrows to aim, `Space` to drop.

### 👑 Supporter Edition ($2.00+)
Support indie development by donating $2.00 or more to receive your **Supporter Key**, unlocking:
* 🌌 **Endless Cozy Night Mode**
* 👑 **Golden Aureate Alembic Theme**
* 🧚 **Instant +500 Gold & Homunculus Idle Familiar**
* 📜 **All Grimoire Recipe Hints Revealed**
```

---

## 4. Bộ Tags Gợi Ý Trên itch.io (Giúp Tăng Lượt Tìm Kiếm Tự Nhiên)
Hãy thêm các tag sau vào mục **Tags**:
`cozy`, `alchemy`, `idle`, `incremental`, `pachinko`, `roguelite`, `relaxing`, `lo-fi`, `crafting`, `simulation`

