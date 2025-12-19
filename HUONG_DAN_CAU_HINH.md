# 🎄 Hướng Dẫn Cấu Hình Nhiều Nguồn Ảnh Cây Thông

## 📝 Giới thiệu

Bây giờ bạn có thể tạo nhiều phiên bản cây thông Noel khác nhau với các bộ ảnh khác nhau để gửi cho nhiều người mà không cần tạo project mới!

## 🚀 Cách sử dụng

### Bước 1: Cấu hình nguồn ảnh

Mở file `src/treeConfig.ts` và thêm nguồn ảnh mới vào mảng `treeSources`:

```typescript
export const treeSources: TreeSource[] = [
  // Nguồn 0: Người nhận đầu tiên
  {
    name: "Tên người nhận 1",
    topPhoto: "/photos/top.png",
    numberedPhotos: Array.from(
      { length: 31 },
      (_, i) => `/photos/${i + 1}.png`
    ),
  },

  // Nguồn 1: Người nhận thứ hai (ví dụ dùng ảnh từ online)
  {
    name: "Tên người nhận 2",
    topPhoto: "https://i.imgur.com/abc123.png",
    numberedPhotos: [
      "https://i.imgur.com/photo1.png",
      "https://i.imgur.com/photo2.png",
      "https://i.imgur.com/photo3.png",
      // Thêm các link ảnh khác...
    ],
  },

  // Thêm các nguồn khác tương tự...
];
```

### Bước 2: Truy cập cây thông theo nguồn

Sau khi cấu hình xong, bạn có thể truy cập các phiên bản khác nhau bằng URL:

- **Nguồn 0 (mặc định)**: `http://localhost:5173/christmas-tree` hoặc `http://localhost:5173/christmas-tree?source=0`
- **Nguồn 1**: `http://localhost:5173/christmas-tree?source=1`
- **Nguồn 2**: `http://localhost:5173/christmas-tree?source=2`
- ...và cứ thế tiếp tục

### Bước 3: Gửi link cho người nhận

Khi deploy lên GitHub Pages, link sẽ có dạng:
- `https://nguyentrungnghia1802.github.io/Christmas/christmas-tree?source=0`
- `https://nguyentrungnghia1802.github.io/Christmas/christmas-tree?source=1`
- v.v.

## 💡 Các cách cấu hình nguồn ảnh

### 1. Sử dụng ảnh từ thư mục local

```typescript
{
  name: "Người nhận A",
  topPhoto: "/photos/top.png",
  numberedPhotos: Array.from({ length: 31 }, (_, i) => `/photos/${i + 1}.png`),
}
```

### 2. Sử dụng ảnh từ Google Drive

Để dùng ảnh từ Google Drive:
1. Upload ảnh lên Google Drive
2. Chuột phải vào ảnh → "Chia sẻ" → "Mọi người có link đều xem được"
3. Lấy ID từ link (phần giữa `/d/` và `/view`)
4. Dùng format: `https://drive.google.com/uc?export=view&id=YOUR_FILE_ID`

```typescript
{
  name: "Người nhận B",
  topPhoto: "https://drive.google.com/uc?export=view&id=1AbC123XyZ",
  numberedPhotos: [
    "https://drive.google.com/uc?export=view&id=1AbC123XyZ1",
    "https://drive.google.com/uc?export=view&id=1AbC123XyZ2",
    // ...
  ],
}
```

### 3. Sử dụng ảnh từ Imgur

```typescript
{
  name: "Người nhận C",
  topPhoto: "https://i.imgur.com/abc123.png",
  numberedPhotos: [
    "https://i.imgur.com/photo1.png",
    "https://i.imgur.com/photo2.png",
    // ...
  ],
}
```

### 4. Sử dụng ảnh từ bất kỳ nguồn nào

Bạn có thể dùng bất kỳ URL ảnh công khai nào:

```typescript
{
  name: "Người nhận D",
  topPhoto: "https://example.com/images/top.jpg",
  numberedPhotos: [
    "https://cdn.example.com/photo1.jpg",
    "https://another-site.com/photo2.png",
    // ...
  ],
}
```

## 📌 Lưu ý quan trọng

1. **Số lượng ảnh**: Mỗi nguồn cần 1 ảnh `topPhoto` (đặt ở đỉnh cây) và tối đa 31 ảnh trong `numberedPhotos`. Nếu bạn có ít hơn 31 ảnh, các ảnh sẽ được lặp lại tự động.

2. **Định dạng ảnh**: Hỗ trợ `.png`, `.jpg`, `.jpeg`, `.webp`

3. **CORS**: Nếu dùng ảnh từ nguồn bên ngoài, đảm bảo server cho phép CORS. Google Drive và Imgur đều hỗ trợ tốt.

4. **Kích thước ảnh**: Nên dùng ảnh có kích thước vừa phải (dưới 2MB mỗi ảnh) để tải nhanh.

## 🎁 Ví dụ hoàn chỉnh

```typescript
export const treeSources: TreeSource[] = [
  // Cây thông cho người yêu
  {
    name: "Người yêu",
    topPhoto: "/photos/couple/top.png",
    numberedPhotos: Array.from({ length: 31 }, (_, i) => `/photos/couple/${i + 1}.png`),
  },

  // Cây thông cho gia đình
  {
    name: "Gia đình",
    topPhoto: "https://i.imgur.com/family-top.png",
    numberedPhotos: [
      "https://i.imgur.com/family1.png",
      "https://i.imgur.com/family2.png",
      // ... thêm 29 ảnh nữa
    ],
  },

  // Cây thông cho bạn bè
  {
    name: "Nhóm bạn",
    topPhoto: "https://drive.google.com/uc?export=view&id=1xyz123",
    numberedPhotos: Array.from({ length: 20 }, (_, i) => 
      `https://drive.google.com/uc?export=view&id=1abc${i}`
    ),
  },
];
```

## 🔧 Troubleshooting

**Lỗi: Ảnh không hiển thị**
- Kiểm tra link ảnh có truy cập được không (mở trực tiếp trên trình duyệt)
- Đảm bảo quyền chia sẻ của ảnh là "Công khai" hoặc "Mọi người có link"

**Lỗi: Trang bị trắng khi truy cập**
- Kiểm tra console của trình duyệt (F12) để xem lỗi chi tiết
- Đảm bảo file `treeConfig.ts` không có lỗi cú pháp

**Source không tồn tại**
- Nếu truy cập `?source=5` mà chỉ có 3 nguồn, hệ thống sẽ tự động dùng nguồn 0

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Console của trình duyệt (F12)
2. File `treeConfig.ts` có đúng cú pháp không
3. Tất cả link ảnh có truy cập được không

Chúc bạn Giáng sinh vui vẻ! 🎅🎄
