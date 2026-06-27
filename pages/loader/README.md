# Loader

Thư viện loader nhẹ, không phụ thuộc, cho phép theo dõi tiến độ tải trang (font, ảnh, API...) và hiển thị bằng nhiều kiểu giao diện khác nhau.

Có hai file chính:

- `loader.js` — file core, dùng cho production. Không tự sinh ra bất kỳ style nào; bạn tự dựng HTML/CSS.
- `loader.demo.js` — file demo, đi kèm `demo.css`. Tự tạo sẵn các kiểu giao diện (`progress`, `spinner`, `dots`, `text`) để xem nhanh, không phải viết CSS.

## Build ra `dist`

Dùng [Terser](https://github.com/terser/terser) để minify. Cài qua npm nếu chưa có:

```bash
npm install -g terser
```

Build hai file vào thư mục `dist`:

```bash
terser .\loader.js -o .\dist\loader.min.js -c passes=2,toplevel=true -m toplevel=true

terser .\loader.demo.js -o .\dist\loader.demo.min.js -c passes=2,toplevel=true -m toplevel=true
```

## Hai chế độ sử dụng

|                     | `loader.demo.js`                 | `loader.js`                    |
| ------------------- | -------------------------------- | ------------------------------ |
| File CSS            | Cần `demo.css`                   | Tự viết CSS                    |
| Sinh HTML giao diện | Tự tạo theo `style`              | Không tạo gì                   |
| Mục đích            | Xem nhanh / demo các kiểu có sẵn | Dùng thật, toàn quyền tùy biến |

---

## Cách dùng với `loader.demo.js`

File demo đi kèm `demo.css` chứa sẵn các class style. Khi gọi `start({ style: ... })`, demo sẽ tự tạo các thẻ HTML tương ứng với class trong `demo.css`, nên bạn chỉ cần một thẻ rỗng làm container.

Xem `index.html` để biết cách bố trí HTML và khởi tạo cho từng kiểu.

### Các `style` hỗ trợ

| `style`    | Mô tả                                     |
| ---------- | ----------------------------------------- |
| `progress` | Thanh tiến độ kèm phần trăm               |
| `spinner`  | Vòng xoay                                 |
| `dots`     | Các chấm chạy theo sóng                   |
| `text`     | Chữ "Loading..." chạy hiệu ứng từng ký tự |
| _(khác)_   | Rơi vào nhánh custom                      |

---

## Cách dùng với `loader.js` (file core)

Khi dùng file core, loader **không tạo ra bất kỳ thẻ giao diện nào**. Bạn tự dựng HTML và CSS bên trong container. Loader chỉ tìm hai phần tử con và bơm dữ liệu vào:

- `.loader-bar` — loader cập nhật `style.width` và `data-value` theo phần trăm tiến độ.
- `.loader-text` — loader cập nhật nội dung text (`xx%`) và `data-value`.

Cả hai đều **tùy chọn**. Nếu không có loader bỏ qua. Nếu muốn dùng chỉ cần thêm thẻ có class như trên, loader sẽ tự gán dữ liệu. Vị trí thẻ có thể đặt ở bất cứ đâu trong loader

### Ví dụ HTML tối thiểu

```html
<div id="app-loader">
  <!-- u custom style -->
  <div>
    ...
    <!-- <div class="loader-bar u-custom"> if u want</div> -->
  </div>
  ...
  <!-- <div class="loader-text u-custom"> if u want</div> -->
</div>
```

### Ví dụ JavaScript

```html
<script>
  const loader = new Loader("#app-loader");
  loader.add("fonts", document.fonts.ready).start();
</script>
```

Vì file core không kèm CSS, bạn tự định nghĩa giao diện cho `.loader-bar`, `.loader-text` và toàn bộ thẻ con theo ý muốn.

---

## Hướng dẫn custom chi tiết

Phần này mô tả từng bước để tự dựng một loader hoàn chỉnh bằng file core, từ HTML đến CSS và JS.

### Bước 1 — Dựng container

Tạo một thẻ bao ngoài làm container và gắn `id` để loader tìm tới. Loader sẽ chèn/đọc các phần tử con bên trong thẻ này.

```html
<div id="app-loader" class="loader"></div>
```

Container để `position: absolute` loader phủ lên trang hoặc 1 container:

```css
.loader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    inset: 0;
    pointer-events: none;
    user-select: none;
    transition: opacity .4s ease;
}
```

`transition: opacity` giúp loader mờ dần khi ẩn thay vì biến mất đột ngột. `pointer-events: none` để loader không chặn thao tác chuột phía dưới.

### Bước 2 — Thêm phần tử mà loader sẽ điều khiển

Loader chỉ quan tâm hai class. Đặt chúng bên trong container, đặt ở đâu và bọc thêm thẻ nào tùy bạn.

```html
<div id="app-loader" class="loader">
  <div class="loader-box">
    <div class="loader-bar"></div>
    <div class="loader-text"></div>
  </div>
</div>
```

| Class          | Loader làm gì                                                   |
| -------------- | --------------------------------------------------------------- |
| `.loader-bar`  | Gán `style.width = "{phần trăm}%"` và `data-value` theo tiến độ |
| `.loader-text` | Gán nội dung `"{phần trăm}%"` và `data-value`                   |

Bỏ `.loader-text` nếu không muốn hiện phần trăm — loader sẽ tự bỏ qua. Bỏ `.loader-bar` nếu kiểu giao diện của bạn không dùng thanh ngang (ví dụ chỉ có chữ hoặc spinner).

### Bước 3 — Style cho các phần tử

Vì file core không kèm CSS, bạn toàn quyền tạo hình. Loader chỉ chỉnh `width` của `.loader-bar`, còn màu sắc, chiều cao, bo góc, hiệu ứng... là của bạn.

```css
#app-loader--u-custom .loader-box {
  width: 80%;
  display: grid;
  align-items: end;
  gap: 10px;
  grid-template-columns: 1fr auto;
}

#app-loader--u-custom .loader-bar {
  height: 4px;
  width: 0;
  border-radius: 2px;
  background: #2997ff;
  box-shadow: 0 0 19px 9px rgba(41, 151, 255, 0.6);
  transition: width 0.05s linear;
}

#app-loader--u-custom .loader-text {
  width: 30px;
  font:
    bold 16px/1 system-ui,
    sans-serif;
  color: #fff;
}
```

Một vài điểm cần lưu ý:
- `data-value` được loader gán trên cả hai phần tử, nên bạn có thể dùng CSS attribute selector để đổi màu theo mốc tiến độ, ví dụ:

```css
.loader-bar[data-value="100"] {
  background: #30d158;
}
```

### Bước 4 — Khởi tạo và thêm tác vụ

Tạo instance trỏ vào container, thêm các tác vụ cần đợi bằng `.add()`, rồi gọi `.start()`.

```html
<script>
  const loader = new Loader("#app-loader");

  loader
    .add("fonts", document.fonts.ready)
    .add("api", fetch("/api/config"))
    .start();
</script>
```

Mỗi `.add(name, promise)` đăng ký một mốc; loader tính phần trăm dựa trên số tác vụ đã resolve trên tổng số. Tiến độ chỉ chạm 100% khi **mọi** tác vụ hoàn tất.

### Bước 5 — Điều chỉnh hành vi qua `start()`

Mặc định loader tự thêm hai mốc `DOMContentLoaded` và `window.load`. Nếu chỉ muốn đợi đúng các tác vụ bạn khai báo, tắt đi bằng `addDefault: false`:

```html
<script>
  const loader = new Loader("#app-loader");
  loader
    .add("data", new Promise((res) => setTimeout(res, 3000)))
    .start({ addDefault: false });
</script>
```

Khi đó loader chỉ đợi tác vụ `data`, không chờ trang load xong. Hữu ích khi bạn muốn loader gắn với một quy trình riêng (tải dữ liệu, khởi tạo app...) thay vì toàn bộ trang.

### Tóm tắt luồng custom

1. Container có `id` → loader gắn vào.
2. Bên trong đặt `.loader-bar` và/hoặc `.loader-text` → loader điều khiển.
3. Bạn tự style mọi thứ.
4. `.add()` các Promise cần đợi.
5. `.start()` để chạy, tùy chọn `addDefault` để bật/tắt mốc mặc định.

---

### Ví dụ: loader riêng cho nút "xem thêm"

Mỗi lần bấm nút, tạo một loader mới gắn vào container của khối đó, đợi đúng request fetch, và chọn style custom cho lần đó:

```js
const t = new Loader("#fetch-data-loader");
t.add(
  "fetch",
  fetch("/api/more").then((r) => r.json()),
).start({
  addDefault: false,
  style: "fetch-data",
});
```

Đặt `addDefault: false` để loader chỉ đợi request fetch, không chờ lại toàn trang.

Container có thể đặt phủ toàn trang để làm loader chính của giao diện:

```html
<div
  id="progress-loader"
  style="position: fixed; z-index: 9999; background: black"></div>
```

---

## Tái sử dụng một instance

Bạn có thể dùng lại **cùng một instance** cho nhiều lần load khác nhau — ví dụ một loader chính cho cả trang, rồi tái dùng nó cho từng lần fetch khi người dùng tương tác.

```js
// Load chính toàn trang
const main = new Loader("#progress-loader");
main.add("fonts", document.fonts.ready).start({ style: "progress" });

// Khi bấm nút "xem thêm" — tái dùng chính instance main
main
  .add("data-01", fetch("/api/data-01"))
  .start({ style: "custom-fetch-data-01" });
```

Cơ chế cần nhớ:

- **Key trùng không load lại.** Các mốc đã tồn tại (`dom`, `load`, `fonts`...) sẽ không bị chạy lại ở lần `start()` sau. Vì vậy giá trị `addDefault` ở những lần start tiếp theo không còn quan trọng — các mốc mặc định đã được thêm từ lần đầu.
- **`start()` chỉ chạy các mốc mới.** Mỗi lần gọi `start()`, loader chỉ theo dõi những tác vụ vừa được `add` thêm.
- **Muốn đổi giao diện thì phải truyền lại `style`.** Nếu không chỉ định `style` ở lần `start()` mới, loader giữ nguyên style của lần trước. Truyền `style` mới (ví dụ `"custom-fetch-data-01"`) để tránh dính style cũ.

---

## Tham khảo API

### `new Loader(selector)`

Tạo một loader gắn vào phần tử khớp với `selector`.

### `.add(name, promise)`

Thêm một tác vụ cần đợi. `name` để nhận diện/log, `promise` là Promise sẽ resolve khi tác vụ xong. Trả về chính instance nên có thể nối chuỗi (chaining).

### `.start(options)`

Bắt đầu theo dõi và hiển thị loader. Các `options` thường dùng:

| Option       | Mặc định   | Ý nghĩa                                                                                                                                              |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style`      | `"custom"` | Đặt cho style class `loader-<u-custom-name>`. Với demo có sẵn: `progress`, `spinner`, `dots`, `text`. |
| `smoothing`  | `0.12`     | Hệ số làm mượt khi tiến độ tăng (càng nhỏ càng mượt/chậm).                                                                                           |
| `ceiling`    | `92`       | Mức phần trăm tối đa khi chưa hoàn tất; chỉ vọt lên 100% khi mọi tác vụ xong.                                                                        |
| `timeout`    | `15000`    | Thời gian (ms) tối đa chờ một tác vụ trước khi bỏ qua.                                                                                               |
| `fadeDelay`  | `350`      | Độ trễ (ms) trước khi loader bắt đầu mờ đi sau khi hoàn tất.                                                                                         |
| `addDefault` | `true`     | Tự thêm hai mốc `dom` (readyState `interactive`) và `load` (readyState `complete`). Đặt `false` để chỉ đợi đúng các tác vụ bạn `add`.                |
