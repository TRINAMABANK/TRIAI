import React, { useRef } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Printer,
  Stamp,
  Award
} from 'lucide-react';

export default function FileViewerModal({ file, onClose }) {
  const printRef = useRef(null);

  if (!file) return null;

  const isImage = file.type === 'png' || file.type === 'jpeg' || file.type === 'jpg' || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg');
  const isExcel = file.type === 'excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  const isWord = file.type === 'word' || file.name.endsWith('.docx') || file.name.endsWith('.doc');
  const isPdf = file.type === 'pdf' || file.name.endsWith('.pdf');

  const getFormatLabel = () => {
    if (isImage) {
      if (file.name.endsWith('.png')) return 'Ảnh chất lượng cao PNG (8K Master)';
      if (file.name.endsWith('.jpeg') || file.name.endsWith('.jpg')) return 'Ảnh kỹ thuật số JPEG (Đa nền tảng)';
      return 'Hình ảnh kỹ thuật số (8K)';
    }
    if (isWord) return 'Văn bản Word (.docx / Times New Roman)';
    if (isExcel) return 'Bảng tính Excel (.xlsx / Times New Roman)';
    if (isPdf) return 'Tài liệu PDF (.pdf / Times New Roman)';
    return 'Tài liệu chuyên ngành';
  };

  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Xác định nội dung nghiệp vụ chi tiết
  const getDocumentData = () => {
    const name = (file.name || '').toLowerCase();

    if (name.includes('lookbook') || name.includes('kol') || name.includes('y_ngoc') || name.includes('ao_dai')) {
      return {
        type: 'lookbook',
        title: 'TỜ TRÌNH XUẤT BẢN CHIẾN DỊCH VISUAL AI & LOOKBOOK THỜI TRANG',
        subTitle: 'V/v: Phê duyệt bộ ảnh Lookbook 8K và tài liệu chiến dịch Người mẫu Ý Ngọc',
        department: 'STUDIO SÁNG TẠO & VISUAL AI Ý NGỌC',
        code: '01/TTr-KOL-TRIAI',
        sections: [
          {
            heading: 'I. CĂN CỨ VÀ MỤC TIÊU CHIẾN DỊCH',
            items: [
              'Căn cứ thỏa thuận hợp tác hình ảnh đại sứ thương hiệu người mẫu Ý Ngọc.',
              'Căn cứ tiêu chuẩn xuất bản hình ảnh thương mại độ phân giải siêu cao 8K Master Campaign.',
              'Mục tiêu: Đảm bảo khóa nhận diện gương mặt nhân vật 100% trong trang phục Áo dài truyền thống và bối cảnh di sản sang trọng.'
            ]
          },
          {
            heading: 'II. KẾT QUẢ RÀ SOÁT VÀ ĐỐI KIỂM KỸ THUẬT',
            table: {
              headers: ['STT', 'Hạng mục kiểm chuẩn', 'Thông số kỹ thuật', 'Kết quả'],
              rows: [
                ['1', 'Nhận diện gương mặt (Face Lock)', 'Sai số < 0.01% qua 5 góc nhìn', 'Đạt 100%'],
                ['2', 'Trang phục & Chất liệu vải', 'Lụa tơ tằm thêu hoa cúc, đính cườm thủ công', 'Đạt chuẩn Haute Couture'],
                ['3', 'Ánh sáng & Nhiếp ảnh Studio', 'Commercial Photography, tiêu cự 85mm F/1.4', 'Sắc nét 8K'],
                ['4', 'Định dạng xuất bản', 'PDF Catalog, PNG 8K Master, JPEG Web', 'Hoàn tất']
              ]
            }
          },
          {
            heading: 'III. ĐÁNH GIÁ RỦI RO & BIỆN PHÁP BẢO VỆ BẢN QUYỀN',
            items: [
              'Tất cả tài nguyên hình ảnh được ký số điện tử và gắn mã nhận diện bản quyền độc quyền TRÍ AI.',
              'Kiểm soát nghiêm ngặt quyền truy cập và phân phối theo thỏa thuận cấp phép thương mại.'
            ]
          },
          {
            heading: 'IV. KẾT LUẬN VÀ KIẾN NGHỊ PHÊ DUYỆT',
            items: [
              'Kính trình Chủ sở hữu hệ thống (Ông Quang Nhựt Trí) phê duyệt phát hành chính thức bộ tài liệu Lookbook.',
              'Chuyển giao bộ phận truyền thông khai thác trên các kênh truyền thông số.'
            ]
          }
        ]
      };
    }

    if (name.includes('pccc') || name.includes('chua_chay') || name.includes('kiem_tra_pccc')) {
      return {
        type: 'pccc',
        title: 'BÁO CÁO KẾT QUẢ THẨM TRA & RÀ SOÁT HỒ SƠ NGHIỆM THU PCCC',
        subTitle: 'V/v: Đối chiếu hồ sơ thi công nghiệm thu phòng cháy chữa cháy theo QCVN 06:2026/BXD',
        department: 'BAN KỸ THUẬT & AN TOÀN CÔNG TRÌNH',
        code: '18/BC-PCCC-TRIAI',
        sections: [
          {
            heading: 'I. CĂN CỨ PHÁP LÝ VÀ TIÊU CHUẨN KỸ THUẬT ÁP DỤNG',
            items: [
              'Luật Phòng cháy và chữa cháy số 27/2001/QH10 và Luật sửa đổi, bổ sung số 40/2013/QH13.',
              'Nghị định 136/2020/NĐ-CP ngày 24/11/2020 của Chính phủ quy định chi tiết thi hành Luật PCCC.',
              'Quy chuẩn kỹ thuật quốc gia QCVN 06:2026/BXD về An toàn cháy cho nhà và công trình.'
            ]
          },
          {
            heading: 'II. NỘI DUNG ĐỐI SOÁT CHI TIẾT HỆ THỐNG PCCC',
            table: {
              headers: ['STT', 'Hệ thống kiểm tra', 'Hiện trạng kỹ thuật', 'Đánh giá'],
              rows: [
                ['1', 'Hệ thống báo cháy tự động', 'Tủ trung tâm 8 loop, đầu báo khói quang điện tầng hầm', 'Hoạt động tốt'],
                ['2', 'Hệ thống chữa cháy Sprinkler', 'Đầu phun hướng lên/xuống, áp lực đường ống duy trì 8 bar', 'Đạt yêu cầu'],
                ['3', 'Trạm bơm chữa cháy', '1 bơm điện chính + 1 bơm diesel dự phòng + 1 bơm bù áp', 'Đủ công suất'],
                ['4', 'Hút khói & Tăng áp cầu thang', 'Quạt hút khói hành lang và tăng áp buồng thang bộ', 'Đạt 50 Pa'],
                ['5', 'Hồ sơ bản vẽ hoàn công', 'Bản vẽ hoàn công khớp 100% với hiện trường thi công', 'Hợp lệ']
              ]
            }
          },
          {
            heading: 'III. CÁC ĐIỂM CẦN LƯU Ý VÀ KHUYẾN NGHỊ BỔ SUNG',
            items: [
              'Cần duy trì niêm phong kiểm định van xả tràn tại trạm bơm tầng hầm.',
              'Bổ sung biên bản thử nghiệm liên động giữa hệ thống báo cháy tự động và thang máy cứu nạn.'
            ]
          },
          {
            heading: 'IV. KẾT LUẬN & KIẾN NGHỊ',
            items: [
              'Hồ sơ đủ điều kiện pháp lý và kỹ thuật để mời cơ quan Cảnh sát PCCC tổ chức nghiệm thu chính thức.',
              'Kính đề nghị Lãnh đạo ký duyệt ban hành báo cáo.'
            ]
          }
        ]
      };
    }

    if (name.includes('mua_sam') || name.includes('bao_gia') || name.includes('ncc') || name.includes('so_sanh')) {
      return {
        type: 'procurement',
        title: 'TỜ TRÌNH BÓC TÁCH & SO SÁNH ĐA BÁO GIÁ NHÀ CUNG CẤP',
        subTitle: 'V/v: Lựa chọn nhà cung cấp tối ưu chi phí và chất lượng thiết bị công trình',
        department: 'PHÒNG MUA SẮM & QUẢN LÝ ĐẤU THẦU',
        code: '25/TTr-PROC-TRIAI',
        sections: [
          {
            heading: 'I. MỤC TIÊU VÀ CĂN CỨ MUA SẮM',
            items: [
              'Căn cứ kế hoạch ngân sách và tiến độ cung ứng thiết bị kỹ thuật năm 2026.',
              'Căn cứ 03 bảng báo giá chính thức nhận từ các Nhà cung cấp đủ điều kiện năng lực.'
            ]
          },
          {
            heading: 'II. BẢNG SO SÁNH ĐỐI CHIẾU CÁC PHƯƠNG ÁN',
            table: {
              headers: ['STT', 'Tiêu chí đánh giá', 'Nhà cung cấp A', 'Nhà cung cấp B (Chọn)', 'Nhà cung cấp C'],
              rows: [
                ['1', 'Tổng giá trị chào thầu', '2.450.000.000 đ', '2.150.000.000 đ', '2.380.000.000 đ'],
                ['2', 'Mức độ tiết kiệm', '0% (Giá trần)', 'Tiết kiệm 12.2%', 'Tiết kiệm 2.8%'],
                ['3', 'Thời gian bảo hành', '24 tháng', '36 tháng', '24 tháng'],
                ['4', 'Chứng chỉ CO/CQ', 'Đầy đủ', 'Đầy đủ, chính hãng 100%', 'Đầy đủ'],
                ['5', 'Tiến độ giao hàng', '30 ngày', '15 ngày', '25 ngày']
              ]
            }
          },
          {
            heading: 'III. ĐÁNH GIÁ TỔNG THỂ & RỦI RO',
            items: [
              'Nhà cung cấp B có phương án tối ưu nhất về tổng chi phí sở hữu (TCO), thời gian giao hàng và chính sách bảo hành.',
              'Hồ sơ năng lực tài chính và pháp lý của Nhà cung cấp B đã được kiểm tra đạt chuẩn 100%.'
            ]
          },
          {
            heading: 'IV. KIẾN NGHỊ PHÊ DUYỆT',
            items: [
              'Kính trình Phê duyệt lựa chọn Nhà cung cấp B là đơn vị trúng thầu cung cấp gói thiết bị.',
              'Ủy quyền cho Tổ mua sắm tiến hành thương thảo và hoàn thiện hợp đồng kinh tế.'
            ]
          }
        ]
      };
    }

    if (name.includes('mau_hop_dong') || name.includes('hop_dong_kinh_te') || name.includes('hop_dong_chuan')) {
      return {
        type: 'contract',
        title: 'HỢP ĐỒNG KINH TẾ / HỢP ĐỒNG DỊCH VỤ THƯƠNG MẠI',
        subTitle: 'Số: 01/2026/HĐKT-TRIAI • Áp dụng chuẩn mẫu doanh nghiệp Việt Nam',
        department: 'HỆ THỐNG PHÁP CHẾ DOANH NGHIỆP TRÍ AI',
        code: '01/2026/HĐKT-TRIAI',
        sections: [
          {
            heading: 'CĂN CỨ PHÁP LÝ KÝ KẾT HỢP ĐỒNG',
            items: [
              'Căn cứ Bộ luật Dân sự số 91/2015/QH13 được Quốc hội ban hành ngày 24/11/2015;',
              'Căn cứ Luật Thương mại số 36/2005/QH11 được Quốc hội ban hành ngày 14/06/2005;',
              'Căn cứ vào nhu cầu và năng lực thực tế của hai Bên tham gia ký kết.'
            ]
          },
          {
            heading: 'THÔNG TIN CÁC BÊN THAM GIA HỢP ĐỒNG',
            table: {
              headers: ['Thông tin định danh', 'BÊN A (BÊN GIAO VIỆC / KHÁCH HÀNG)', 'BÊN B (BÊN THỰC HIỆN / TRÍ AI)'],
              rows: [
                ['Tên đơn vị / Doanh nghiệp', 'CÔNG TY TNHH / DOANH NGHIỆP ĐỐI TÁC', 'NỀN TẢNG AI SAAS DOANH NGHIỆP TRÍ AI'],
                ['Đại diện pháp luật', 'Ông / Bà: Đại Diện Khách Hàng', 'Ông: QUANG NHỰT TRÍ'],
                ['Chức vụ', 'Tổng Giám Đốc / Giám Đốc', 'Chủ sở hữu & Giám Đốc Điều Hành'],
                ['Mã số thuế / Số CCCD', '0315xxxxxx', '0982441446 (OCB Bank)'],
                ['Địa chỉ trụ sở', 'Trụ sở chính Doanh nghiệp Bên A', 'Tòa nhà Công nghệ TRÍ AI, TP. Hồ Chí Minh'],
                ['Email / Điện thoại', 'khachhang@doanhnghiep.vn', 'triqnnamabank@gmail.com']
              ]
            }
          },
          {
            heading: 'ĐIỀU 1: ĐỐI TƯỢNG VÀ PHẠM VI CÔNG VIỆC',
            items: [
              'Bên A đồng ý giao và Bên B đồng ý nhận thực hiện cung cấp giải pháp chuyển đổi số, tích hợp hệ thống 33 bộ Kỹ năng AI Chuyên sâu và dịch vụ tư vấn vận hành theo yêu cầu của Bên A.',
              'Chi tiết các hạng mục công việc, tiêu chuẩn nghiệm thu và thời hạn bàn giao được quy định chi tiết tại Phụ lục 01 đính kèm Hợp đồng này.'
            ]
          },
          {
            heading: 'ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN',
            items: [
              'Tổng giá trị hợp đồng trước thuế: Được quy định theo từng gói giải pháp lựa chọn.',
              'Phương thức thanh toán: Chuyển khoản ngân hàng qua cổng thanh toán tự động VietQR Napas 247 (Ngân hàng TMCP Phương Đông - OCB, STK: 0982441446, Chủ TK: QUANG NHỰT TRÍ).',
              'Tiến độ thanh toán: Tạm ứng 30% sau khi ký hợp đồng, 70% còn lại sau khi nghiệm thu bàn giao và cấp bản quyền chính thức.'
            ]
          },
          {
            heading: 'ĐIỀU 3: BẢO HÀNH, BẢO TRÌ VÀ BẢO MẬT DỮ LIỆU',
            items: [
              'Bên B cam kết bảo mật 100% toàn bộ cơ sở dữ liệu, tài liệu kỹ thuật và thông tin kinh doanh của Bên A.',
              'Thời gian hỗ trợ kỹ thuật: 24/7 trong suốt thời hạn hiệu lực của bản quyền.'
            ]
          },
          {
            heading: 'ĐIỀU 4: PHẠT VI PHẠM VÀ GIẢI QUYẾT TRANH CHẤP',
            items: [
              'Bên nào vi phạm nghĩa vụ hợp đồng phải chịu phạt vi phạm theo quy định tại Luật Thương mại với mức phạt 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm.',
              'Mọi tranh chấp phát sinh sẽ được hai bên thương lượng giải quyết trên tinh thần hợp tác. Trường hợp không tự hòa giải được sẽ đưa ra Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) để giải quyết theo quy định.'
            ]
          }
        ]
      };
    }

    if (name.includes('hop_dong') || name.includes('phap_ly') || name.includes('ra_soat')) {
      return {
        type: 'legal',
        title: 'BÁO CÁO RÀ SOÁT PHÁP LÝ & ĐÁNH GIÁ RỦI RO HỢP ĐỒNG',
        subTitle: 'V/v: Thẩm tra các điều khoản kinh tế, bảo lãnh và giải quyết tranh chấp',
        department: 'BAN PHÁP CHẾ & QUẢN TRỊ RỦI RO',
        code: '09/BC-PC-TRIAI',
        sections: [
          {
            heading: 'I. CĂN CỨ VÀ PHẠM VI RÀ SOÁT',
            items: [
              'Bộ luật Dân sự số 91/2015/QH13 và Luật Thương mại số 36/2005/QH11.',
              'Dự thảo Hợp đồng kinh tế và các phụ lục kỹ thuật đính kèm.'
            ]
          },
          {
            heading: 'II. KẾT QUẢ RÀ SOÁT CÁC ĐIỀU KHOẢN TRỌNG YẾU',
            table: {
              headers: ['STT', 'Điều khoản kiểm tra', 'Đánh giá pháp lý', 'Khuyến nghị'],
              rows: [
                ['1', 'Chủ thể & Thẩm quyền ký', 'Người đại diện theo pháp luật hợp pháp', 'Hợp lệ'],
                ['2', 'Điều khoản tạm ứng & Bảo lãnh', 'Bắt buộc bảo lãnh tạm ứng ngân hàng', 'Đã bổ sung'],
                ['3', 'Trách nhiệm vi phạm hợp đồng', 'Mức phạt 8% giá trị vi phạm theo Luật', 'Đạt chuẩn'],
                ['4', 'Cơ chế xử lý bất khả kháng', 'Rõ ràng, phù hợp thông lệ quốc tế', 'Đạt yêu cầu'],
                ['5', 'Thẩm quyền tài phán', 'Trung tâm Trọng tài Quốc tế VIAC', 'Đã chuẩn hóa']
              ]
            }
          },
          {
            heading: 'III. KẾT LUẬN & ĐỀ XUẤT',
            items: [
              'Dự thảo hợp đồng đã được điều chỉnh chặt chẽ, bảo vệ tối đa quyền lợi của Doanh nghiệp.',
              'Đủ điều kiện pháp lý để trình Lãnh đạo ký kết chính thức.'
            ]
          }
        ]
      };
    }

    // Default Fallback
    return {
      type: 'general',
      title: 'BÁO CÁO KẾT QUẢ XỬ LÝ CHUYÊN MÔN VÀ KIẾN NGHỊ THỰC HIỆN',
      subTitle: `V/v: Phê duyệt kết quả xử lý theo tiêu chuẩn TRÍ AI SaaS Enterprise - ${file.name}`,
      department: 'HỆ THỐNG TRÍ TUỆ NHÂN TẠO TRÍ AI',
      code: '88/BC-TRIAI-SAAS',
      sections: [
        {
          heading: 'I. MỤC TIÊU VÀ PHẠM VI THỰC HIỆN',
          items: [
            'Đáp ứng toàn diện các tiêu chí kỹ thuật và nghiệp vụ theo yêu cầu công việc.',
            'Đảm bảo tính chính xác, nhất quán và tuân thủ các quy định hiện hành.'
          ]
        },
        {
          heading: 'II. KẾT QUẢ ĐỐI SOÁT CHI TIẾT',
          table: {
            headers: ['STT', 'Nội dung kiểm tra', 'Hiện trạng đối soát', 'Kết quả'],
            rows: [
              ['1', 'Cơ sở dữ liệu đầu vào', 'Đầy đủ, đồng bộ và đã được làm sạch', 'Đạt 100%'],
              ['2', 'Logic và tính khả thi', 'Lập luận chặt chẽ, không có xung đột', 'Đạt chuẩn'],
              ['3', 'Tiến độ và nguồn lực', 'Tối ưu hóa thời gian thực hiện', 'Vượt tiến độ'],
              ['4', 'Chất lượng xuất bản', 'Định dạng chuẩn Word, PDF, Excel', 'Hoàn tất']
            ]
          }
        },
        {
          heading: 'III. KẾT LUẬN VÀ KIẾN NGHỊ',
          items: [
            'Hồ sơ chuyên môn đã hoàn thiện đạt chuẩn chất lượng cao nhất.',
            'Kính đề nghị Lãnh đạo phê duyệt để triển khai các bước tiếp theo.'
          ]
        }
      ]
    };
  };

  const docData = getDocumentData();

  // 1. Xuất file Word (.doc HTML XML với font Times New Roman chuẩn)
  const handleExportWord = () => {
    let tableHtml = '';
    docData.sections.forEach(sec => {
      if (sec.table) {
        tableHtml += `<h3 style="font-size: 14pt; margin-top: 14pt; font-weight: bold; font-family: 'Times New Roman', serif;">${sec.heading}</h3>`;
        tableHtml += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 12pt;">`;
        tableHtml += `<tr style="background-color: #f2f4f8; font-weight: bold; text-align: center;">`;
        sec.table.headers.forEach(h => {
          tableHtml += `<th style="padding: 8px; border: 1px solid #333;">${h}</th>`;
        });
        tableHtml += `</tr>`;
        sec.table.rows.forEach(r => {
          tableHtml += `<tr>`;
          r.forEach((cell, idx) => {
            const align = idx === 0 ? 'center' : idx === 1 ? 'left' : 'center';
            tableHtml += `<td style="padding: 6px 8px; border: 1px solid #333; text-align: ${align};">${cell}</td>`;
          });
          tableHtml += `</tr>`;
        });
        tableHtml += `</table>`;
      } else if (sec.items) {
        tableHtml += `<h3 style="font-size: 14pt; margin-top: 14pt; font-weight: bold; font-family: 'Times New Roman', serif;">${sec.heading}</h3>`;
        tableHtml += `<ul style="margin-left: 20pt; line-height: 1.4; font-size: 13pt; font-family: 'Times New Roman', serif;">`;
        sec.items.forEach(it => {
          tableHtml += `<li style="margin-bottom: 4pt;">${it}</li>`;
        });
        tableHtml += `</ul>`;
      }
    });

    const fullWordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docData.title}</title>
        <style>
          @page WordSection1 {
            size: 21.0cm 29.7cm;
            margin: 2.0cm 2.0cm 2.0cm 2.5cm;
            mso-header-margin: 1.0cm;
            mso-footer-margin: 1.0cm;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            line-height: 1.35;
            color: #000000;
          }
          p { margin: 0 0 6pt 0; text-align: justify; }
          .header-table { width: 100%; border: none; margin-bottom: 15pt; }
          .header-table td { border: none; vertical-align: top; }
          .center-bold { text-align: center; font-weight: bold; }
          .title-doc { font-size: 16pt; font-weight: bold; text-align: center; margin: 15pt 0 5pt 0; }
          .subtitle-doc { font-size: 13pt; font-style: italic; text-align: center; margin-bottom: 20pt; }
          .sign-table { width: 100%; border: none; margin-top: 25pt; }
          .sign-table td { border: none; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <table class="header-table">
            <tr>
              <td style="width: 45%; text-align: center;">
                <div style="font-size: 11pt; font-weight: bold;">${docData.department}</div>
                <div style="font-size: 11pt; font-weight: bold;">HỆ THỐNG TRÍ AI ENTERPRISE</div>
                <div style="font-size: 11pt; margin-top: 4pt;">Số: ${docData.code}</div>
              </td>
              <td style="width: 55%; text-align: center;">
                <div style="font-size: 12pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-size: 13pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
                <div style="font-size: 10pt;">------------------------</div>
                <div style="font-size: 12pt; font-style: italic; margin-top: 4pt;">Hồ Chí Minh, ngày ${currentDateStr.split('/')[0]} tháng ${currentDateStr.split('/')[1]} năm ${currentDateStr.split('/')[2]}</div>
              </td>
            </tr>
          </table>

          <div class="title-doc">${docData.title}</div>
          <div class="subtitle-doc">${docData.subTitle}</div>

          ${tableHtml}

          <table class="sign-table">
            <tr>
              <td style="width: 45%;">
                <div style="font-weight: bold; font-style: italic; font-size: 12pt;">Nơi nhận:</div>
                <div style="font-size: 11pt;">- Ban Giám Đốc TRÍ AI;</div>
                <div style="font-size: 11pt;">- Các bộ phận liên quan;</div>
                <div style="font-size: 11pt;">- Lưu: VT, HS.</div>
              </td>
              <td style="width: 55%; text-align: center;">
                <div style="font-weight: bold; font-size: 13pt;">NGƯỜI PHÊ DUYỆT / CHỦ SỞ HỮU</div>
                <div style="font-size: 11pt; font-style: italic;">(Ký số điện tử và đóng dấu xác thực)</div>
                <br/><br/><br/>
                <div style="font-weight: bold; font-size: 14pt; color: #1c68e8;">QUANG NHỰT TRÍ</div>
                <div style="font-size: 11pt; color: #10b981;">[ĐÃ KÝ DUYỆT BẰNG CHỮ KÝ SỐ TRÍ AI]</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + fullWordHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_TimesNewRoman.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. In hoặc Xuất file PDF (Chuẩn khổ giấy A4, font Times New Roman sắc nét)
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup trình duyệt để in / xuất PDF.');
      return;
    }

    const printContent = printRef.current?.innerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${docData.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 20mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', Times, "Liberation Serif", serif !important;
          }
          body {
            background: #ffffff;
            color: #000000;
            font-size: 13pt;
            line-height: 1.35;
            padding: 10px;
          }
          .a4-page {
            width: 100%;
            background: #ffffff;
          }
          .doc-header-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
          }
          .doc-header-left, .doc-header-right {
            text-align: center;
          }
          .doc-title-main {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin: 20px 0 6px;
            text-transform: uppercase;
          }
          .doc-subtitle {
            font-size: 13pt;
            font-style: italic;
            text-align: center;
            margin-bottom: 25px;
          }
          .doc-section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 18px;
            margin-bottom: 8px;
          }
          .doc-list {
            margin-left: 24px;
            margin-bottom: 12px;
          }
          .doc-list li {
            margin-bottom: 5px;
            text-align: justify;
          }
          table.doc-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 16px;
            font-size: 12pt;
          }
          table.doc-table th, table.doc-table td {
            border: 1px solid #222;
            padding: 7px 10px;
          }
          table.doc-table th {
            background-color: #f1f3f6 !important;
            font-weight: bold;
            text-align: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .doc-sign-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            page-break-inside: avoid;
          }
          .signature-box {
            text-align: center;
          }
          .stamp-badge {
            display: inline-block;
            border: 2px dashed #10b981;
            color: #10b981;
            padding: 4px 10px;
            font-size: 11pt;
            font-weight: bold;
            border-radius: 4px;
            margin-top: 8px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="a4-page">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container file-viewer-modal" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '940px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 22px' }}>
          <div className="modal-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`file-badge-icon ${isImage ? 'image-bg' : isExcel ? 'excel-bg' : isWord ? 'word-bg' : 'pdf-bg'}`} style={{ width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isImage ? <Sparkles size={22} color="#ec4899" /> : isExcel ? <FileSpreadsheet size={22} color="#10b981" /> : isWord ? <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '20px', fontFamily: '"Times New Roman", serif' }}>W</span> : <FileText size={22} color="#ef4444" />}
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{file.name}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                Định dạng: <strong style={{ color: '#2563eb' }}>{getFormatLabel()}</strong> • Phông chữ chuẩn: <strong style={{ color: '#0f172a' }}>Times New Roman</strong>
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handlePrintPdf} 
              className="btn-print-doc"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="In ra máy in hoặc Lưu dưới dạng PDF chuẩn khổ A4"
            >
              <Printer size={16} /> In / Xuất PDF (.pdf)
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Đóng cửa sổ">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (DOCUMENT PREVIEW CANVAS) */}
        <div className="file-preview-body" style={{ overflowY: 'auto', padding: '24px', background: '#f1f5f9', flex: 1 }}>
          {isImage ? (
            /* TRƯỜNG HỢP XEM ẢNH KOL */
            <div className="file-image-preview-container" style={{ textAlign: 'center' }}>
              <div className="image-preview-wrapper" style={{ display: 'inline-block', position: 'relative', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                <img 
                  src={file.url || file.downloadUrl || "/assets/y_ngoc_aodai.jpg"} 
                  alt={file.name} 
                  className="file-preview-img-tag"
                  style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.src = '/assets/brand_logo.png';
                  }}
                />
                <div className="image-preview-tag-overlay" style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#ec4899" /> 8K Master Resolution • Lookbook KOL
                </div>
              </div>
              <div className="preview-meta-row" style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '14px' }}>
                <span className="verify-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}><CheckCircle2 size={15} /> Khóa nhận diện gương mặt: 100%</span>
                <span className="secure-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}><ShieldCheck size={15} /> Chuẩn in ấn Campaign 8K</span>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP VĂN BẢN HÀNH CHÍNH & KỸ THUẬT A4 TIMES NEW ROMAN */
            <div 
              className="a4-document-container"
              ref={printRef}
              style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '820px',
                margin: '0 auto',
                padding: '48px 56px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderRadius: '4px',
                fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                color: '#000000',
                fontSize: '13.5pt',
                lineHeight: 1.4,
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              {/* WATERMARK BẢO MẬT */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '48pt',
                color: 'rgba(28, 104, 232, 0.04)',
                fontWeight: '900',
                pointerEvents: 'none',
                letterSpacing: '6px',
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}>
                TRÍ AI ENTERPRISE
              </div>

              {/* HEADER VĂN BẢN CHUẨN NGHỊ ĐỊNH 30 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div style={{ width: '46%', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' }}>
                    {docData.department}
                  </div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#2563eb', marginTop: '2px' }}>
                    NỀN TẢNG AI SAAS TRÍ AI
                  </div>
                  <div style={{ fontSize: '11pt', marginTop: '4px', color: '#475569' }}>
                    Số: <strong>{docData.code}</strong>
                  </div>
                </div>

                <div style={{ width: '52%', textAlign: 'center' }}>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div style={{ fontSize: '12.5pt', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div style={{ margin: '3px auto 6px', width: '120px', height: '1.5px', background: '#0f172a' }}></div>
                  <div style={{ fontSize: '11.5pt', fontStyle: 'italic', color: '#475569' }}>
                    Hồ Chí Minh, ngày {currentDateStr.split('/')[0]} tháng {currentDateStr.split('/')[1]} năm {currentDateStr.split('/')[2]}
                  </div>
                </div>
              </div>

              {/* TIÊU ĐỀ VĂN BẢN */}
              <div style={{ textAlign: 'center', margin: '22px 0 8px' }}>
                <h1 style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '16pt',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: '#0f172a',
                  lineHeight: 1.3,
                  margin: 0
                }}>
                  {docData.title}
                </h1>
                <div style={{
                  fontSize: '12.5pt',
                  fontStyle: 'italic',
                  color: '#475569',
                  marginTop: '6px',
                  marginBottom: '22px'
                }}>
                  {docData.subTitle}
                </div>
              </div>

              {/* NỘI DUNG CHI TIẾT TỪNG MỤC */}
              {docData.sections.map((section, idx) => (
                <div key={idx} style={{ marginBottom: '18px' }}>
                  <h2 style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '13.5pt',
                    fontWeight: 'bold',
                    color: '#0f172a',
                    margin: '14px 0 8px',
                    textTransform: 'uppercase'
                  }}>
                    {section.heading}
                  </h2>

                  {section.items && (
                    <ul style={{ margin: '0 0 10px 24px', padding: 0 }}>
                      {section.items.map((it, i) => (
                        <li key={i} style={{ marginBottom: '6px', textAlign: 'justify', lineHeight: 1.45 }}>
                          {it}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.table && (
                    <div style={{ overflowX: 'auto', margin: '10px 0 14px' }}>
                      <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5pt' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {section.table.headers.map((h, i) => (
                              <th key={i} style={{ border: '1px solid #334155', padding: '8px 10px', textAlign: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? '#fafcff' : '#ffffff' }}>
                              {row.map((cell, cIdx) => (
                                <td 
                                  key={cIdx} 
                                  style={{
                                    border: '1px solid #334155',
                                    padding: '7px 10px',
                                    textAlign: cIdx === 0 ? 'center' : cIdx === 1 ? 'left' : 'center',
                                    color: '#1e293b'
                                  }}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* PHẦN CHỮ KÝ, ĐÓNG DẤU VÀ PHÊ DUYỆT */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ width: '42%' }}>
                  <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '11.5pt', color: '#0f172a', marginBottom: '4px' }}>
                    Nơi nhận:
                  </div>
                  <div style={{ fontSize: '10.5pt', color: '#475569', lineHeight: 1.4 }}>
                    • Ban Giám Đốc TRÍ AI SaaS;<br />
                    • Các bộ phận thực thi chuyên môn;<br />
                    • Khách hàng & Đối tác doanh nghiệp;<br />
                    • Lưu: VT, Hồ sơ điện tử TRÍ AI.
                  </div>
                </div>

                <div style={{ width: '54%', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12.5pt', textTransform: 'uppercase', color: '#0f172a' }}>
                    NGƯỜI PHÊ DUYỆT / MASTER ADMIN
                  </div>
                  <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>
                    (Ký số điện tử và đóng dấu xác thực)
                  </div>
                  
                  <div style={{ height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1.5px solid #10b981', color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: '6px', fontSize: '11pt', fontWeight: 'bold' }}>
                      <ShieldCheck size={16} /> TRÍ AI VERIFIED • CHỮ KÝ HỢP LỆ
                    </div>
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '13.5pt', color: '#1c68e8' }}>
                    QUANG NHỰT TRÍ
                  </div>
                  <div style={{ fontSize: '10.5pt', color: '#64748b' }}>
                    Email: triqnnamabank@gmail.com
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
            <Award size={16} color="#2563eb" />
            <span>Tài liệu tuân thủ chuẩn trình bày hành chính Việt Nam & Quốc tế</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn-cancel" 
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
            >
              Đóng
            </button>
            <button 
              className="btn-download-file" 
              onClick={handleExportWord}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#1c68e8',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(28, 104, 232, 0.25)'
              }}
            >
              <Download size={16} /> Xuất file Word (.docx / Times New Roman)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
