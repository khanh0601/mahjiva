# Quy tắc dự án: 100% Dữ liệu thật từ máy chủ Shopify (Chính sách KHÔNG DÙNG MOCK)

## 1. Tuyệt đối không sử dụng dữ liệu Mock / Giả lập:
- Không hardcode mảng dữ liệu giả, không tự bịa danh sách tiền tệ, danh sách quốc gia (như mảng `US,VN,CA,GB...`).
- Không tự điền giá giả, tên sản phẩm giả ("The Imperial Sovereign", "14,800 USD") hoặc ảnh mẫu giả trong mã nguồn Liquid hoặc JSON.

## 2. Máy chủ Shopify là Nguồn Chân Lý Duy Nhất (Single Source of Truth):
- **Tiền tệ & Quốc gia**: Đọc trực tiếp 100% từ đối tượng hệ thống của máy chủ Shopify:
  - `localization.country`: Quốc gia đang được chọn thực tế trên phiên bản người dùng.
  - `localization.available_countries`: Danh sách toàn bộ các quốc gia / thị trường mà quản trị viên thực sự kích hoạt trong Shopify Admin (Markets).
  - `localization.country.currency.iso_code`, `symbol`, `name`.
- **Sản phẩm & Bộ sưu tập**: Đọc trực tiếp từ `collection.products`, `product.title`, `product.price | money`, `product.featured_image`, `product.url`.
- Khi khách hàng đổi tiền tệ / quốc gia: Gửi dữ liệu trực tiếp về máy chủ Shopify qua `<input name="country_code">` trong form `localization`.

## 3. Xử lý trạng thái trống (Empty State):
- Nếu quản trị viên chưa chọn Collection hoặc chưa gán sản phẩm vào Block:
  - Trong màn hình chỉnh sửa theme (`request.design_mode`): Hiển thị khung hướng dẫn rõ ràng yêu cầu quản trị viên chọn dữ liệu từ Shopify Admin.
  - Ngoài trang thật dành cho khách mua: Không render thẻ rác hoặc dữ liệu giả.

## 4. Phạm vi áp dụng:
- Áp dụng trên toàn bộ Header, Footer, Hero Slider, Collection Grid, Collection Tabs và mọi khối (Block) / Section trong toàn bộ dự án.
