# Mahjiva – Hướng dẫn nhập liệu SEO trong Shopify Admin

Store: `https://admin.shopify.com/store/ktxs0v-ve`

Hiện tại một số tiêu đề SEO, mô tả SEO, chuyển hướng và nội dung chính sách đang được viết cứng trong code theme. Chúng ta chuyển chúng về đúng chỗ trong Shopify Admin, sau đó dev sẽ gỡ phần viết cứng khỏi code.

**Quan trọng:** làm xong các bước dưới đây rồi báo lại cho dev. Dev chỉ gỡ code sau khi dữ liệu đã có trong Admin. Khách truy cập sẽ không thấy gì thay đổi trong lúc bạn nhập.

Có 4 việc, làm theo thứ tự. Tổng thời gian khoảng 20–30 phút.

---

## Việc 1 – Mô tả SEO cho trang chủ

Vào **Online Store → Preferences**, phần **Title and meta description**.

| Ô | Giá trị cần có |
|---|---|
| Homepage title | `Mahjiva \| Luxury American Mahjong Sets & Accessories` (đang đúng, chỉ kiểm tra lại) |
| Homepage meta description | `Luxury American Mahjong sets and bespoke accessories crafted to NMJL standards. Discover artful tile designs, complimentary worldwide shipping, and dedicated concierge care.` |

---

## Việc 2 – SEO cho sản phẩm và trang

Mở từng mục, kéo xuống cuối trang tới phần **Search engine listing**, bấm **Edit**, rồi dán giá trị vào.

Không gõ thêm "– Mahjiva" vào cuối Page title: theme tự thêm tên shop.

### Sản phẩm (Products)

| Sản phẩm | Page title | Meta description |
|---|---|---|
| Tiger & Peony Mahjong Mat | giữ nguyên | `Inspired by Asian artistry, the Tiger & Peony Mahjong Mat features majestic tigers, blooming peonies, and water-resistant neoprene with non-slip rubber backing.` |
| Everyday Mahjong Tile Bag | `Everyday Mahjong Tile Bag` | `Explore the Everyday Mahjong Tile Bag by Mahjiva. Handcrafted with durable quilted canvas, padded lining, and elegant storage for your tiles.` |
| Crystal Clear Mahjong Racks - Set of 4 | `Crystal Clear Mahjong Racks - Set of 4` | `Explore the Crystal Clear Mahjong Racks (Set of 4) by Mahjiva. Handcrafted high-clarity acrylic with integrated brass pushers.` |

### Trang (Online Store → Pages)

| Trang | Page title | Meta description |
|---|---|---|
| About Us (`/pages/about-us`) | `About Us` | Hiện đang là `Mahjiva \| Luxury American Mahjong Sets & Accessories`, chưa phải mô tả. Cần viết lại, tối đa khoảng 155 ký tự. Gợi ý lấy từ chính nội dung trang: `Mahjiva creates expressive American Mahjong tiles and coordinating accessories that bring personality to the table and celebrate the connections around it.` |

### Kiểm tra chữ còn sót từ store khác

Trong **Pages** và **Settings → Policies**, tìm xem có chỗ nào còn chữ `Spooky Haven` hoặc `DASON` (trong nội dung hoặc trong ô Meta description). Nếu có thì ghi lại tên trang và báo dev; riêng ô Meta description thì xoá hoặc viết lại luôn.

---

## Việc 3 – Nội dung 4 trang chính sách

Vào **Settings → Policies**. Với mỗi chính sách:

1. Mở chính sách, bấm nút **`<>`** (Show HTML) trên thanh công cụ của ô soạn thảo.
2. Xoá nội dung cũ, mở file tương ứng bên dưới bằng Notepad, copy toàn bộ và dán vào.
3. Bấm **`<>`** lần nữa để xem lại ở chế độ thường, rồi **Save**.

| Chính sách trong Admin | File cần dán |
|---|---|
| Return and refund policy | `policies/refund-policy.html` |
| Privacy policy | `policies/privacy-policy.html` |
| Terms of service | `policies/terms-of-service.html` |
| Shipping policy | `policies/shipping-policy.html` |

Lưu ý:

- Nội dung trong 4 file này **giống hệt chữ đang hiển thị trên website**, chỉ bỏ phần trình bày. Không cần biên tập lại câu chữ.
- Tiêu đề lớn của trang (ví dụ "Refund Policy") đã được bỏ khỏi file, vì Shopify tự hiển thị tiêu đề chính sách.
- Sau khi dán, phần trình bày trong ô soạn thảo sẽ đơn giản hơn trên web (các ô thông tin thành đoạn văn thường). Như vậy là đúng; dev sẽ lo phần giao diện.
- Nếu Admin báo lỗi khi lưu hoặc tự xoá mất bảng/đường link, chụp màn hình gửi dev.

---

## Việc 4 – Chuyển hướng 301

### Bước A – Import ngay

Mở thẳng trang https://admin.shopify.com/store/ktxs0v-ve/redirects (hoặc vào **Content → Menus**, bấm **View URL redirects** ở góc trên bên phải), bấm **Import**, chọn file `redirects-1-import-ngay.csv`.

File gồm 6 dòng; các địa chỉ nguồn hiện đều không tồn tại nên chuyển hướng có hiệu lực ngay:

| Từ | Đến |
|---|---|
| `/pages/about` | `/pages/about-us` |
| `/pages/our-story` | `/pages/about-us` |
| `/pages/contact-information` | `/pages/about-us` |
| `/pages/returns` | `/policies/refund-policy` |
| `/pages/policy` | `/policies/refund-policy` |
| `/pages/shipping-policy` | `/policies/shipping-policy` |

### Bước B – Ẩn 4 trang trùng và chuyển hướng

Bốn trang dưới đây đang tồn tại song song với trang chính sách chính thức và hiển thị cùng một nội dung, gây trùng lặp với Google. Hướng xử lý là ẩn 4 trang này và chuyển hướng về trang chính sách.

| Trang đang trùng (Pages) | Chuyển về |
|---|---|
| `/pages/refund-policy` | `/policies/refund-policy` |
| `/pages/privacy-policy` | `/policies/privacy-policy` |
| `/pages/terms-of-service` | `/policies/terms-of-service` |
| `/pages/shipping-information` | `/policies/shipping-policy` |

Thứ tự làm:

1. Vào **Content → Menus → Main menu**. Dev đã quét website: không còn link nào hiển thị trỏ tới 4 trang trên, nhưng Main menu có thể có một mục tên "Policy" / "Refund Policy" / "Returns" đang trỏ tới `/pages/refund-policy` (code đang tự đổi hướng mục này). Nếu thấy, sửa mục đó cho trỏ tới **Policies → Refund policy**. Các menu khác không được theme sử dụng, không cần sửa.
2. Vào **Online Store → Pages**, mở từng trang trong 4 trang trên, đổi **Visibility** thành **Hidden**. Không xoá trang.
3. Import file `redirects-2-sau-khi-an-page.csv` giống bước A.

Shopify chỉ áp dụng chuyển hướng khi địa chỉ nguồn không còn hiển thị, nên phải ẩn trang trước rồi mới import.

---

## Khi xong, báo lại cho dev

- [ ] Việc 1 – Mô tả SEO trang chủ
- [ ] Việc 2 – SEO 3 sản phẩm + trang About Us
- [ ] Việc 2 – Có/không thấy chữ `Spooky Haven`, `DASON` (ghi tên trang nếu có)
- [ ] Việc 3 – Đã dán 4 chính sách
- [ ] Việc 4A – Đã import `redirects-1-import-ngay.csv`
- [ ] Việc 4B – Đã sửa Main menu (nếu có), ẩn 4 trang, import `redirects-2-sau-khi-an-page.csv`
