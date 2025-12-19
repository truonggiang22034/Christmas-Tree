/**
 * Cấu hình nguồn ảnh cho cây thông Noel
 * 
 * Để gửi cây thông cho nhiều người khác nhau:
 * 1. Thêm các đường link ảnh vào mảng treeSources bên dưới
 * 2. Mỗi nguồn sẽ tương ứng với 1 người nhận
 * 3. Truy cập theo URL: /christmas-tree?source=0, /christmas-tree?source=1, v.v.
 */

export interface TreeSource {
  name: string; // Tên người nhận (tùy chọn, để dễ quản lý)
  topPhoto: string; // Link ảnh đặt ở đỉnh cây
  numberedPhotos: string[]; // Mảng các link ảnh được đánh số (tối đa 31 ảnh)
}

/**
 * HƯỚNG DẪN SỬ DỤNG:
 * 
 * - Để sử dụng ảnh từ thư mục local /photos:
 *   topPhoto: '/photos/top.png'
 *   numberedPhotos: Array.from({ length: 31 }, (_, i) => `/photos/${i + 1}.png`)
 * 
 * - Để sử dụng ảnh từ nguồn online (Google Drive, Imgur, v.v.):
 *   topPhoto: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID'
 *   numberedPhotos: ['https://i.imgur.com/abc123.png', 'https://i.imgur.com/def456.png', ...]
 * 
 * - Nếu có ít hơn 31 ảnh, code sẽ tự động lặp lại các ảnh có sẵn
 */

// Detect if on GitHub Pages and adjust path accordingly
const photoBasePath = window.location.hostname === 'truonggiang22034.github.io' 
  ? '/Christmas-Tree/photos' 
  : '/photos';

export const treeSources: TreeSource[] = [
  // Nguồn 0: Ảnh mặc định từ thư mục local
  {
    name: "Default",
    topPhoto: `${photoBasePath}/default/top.png`,
    numberedPhotos: Array.from(
      { length: 31 },
      (_, i) => `${photoBasePath}/default/${i + 1}.png`
    ),
  },

  // // Nguồn 1: Ảnh mặc định từ thư mục local
  {
    name: "Anh Giang",
    topPhoto: `${photoBasePath}/a-giang/top.png`,
    numberedPhotos: Array.from(
      { length: 31 },
      (_, i) => `${photoBasePath}/a-giang/${i + 1}.png`
    ),
  },

];

/**
 * Lấy nguồn ảnh theo index hoặc query parameter
 * @param sourceIndex - Index của nguồn ảnh (mặc định là 0)
 * @returns Nguồn ảnh tương ứng
 */
export const getTreeSource = (sourceIndex: number = 0): TreeSource => {
  if (sourceIndex < 0 || sourceIndex >= treeSources.length) {
    console.warn(`Source index ${sourceIndex} không hợp lệ. Sử dụng nguồn mặc định (0).`);
    return treeSources[0];
  }
  return treeSources[sourceIndex];
};

/**
 * Lấy tất cả đường dẫn ảnh (topPhoto + numberedPhotos) cho preloading
 * @param source - Nguồn ảnh
 * @returns Mảng tất cả đường dẫn ảnh
 */
export const getAllPhotoPaths = (source: TreeSource): string[] => {
  return [source.topPhoto, ...source.numberedPhotos];
};
