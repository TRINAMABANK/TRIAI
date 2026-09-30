/**
 * TRÍ AI — VIETNAMESE ADMINISTRATIVE & COMMERCIAL DOCUMENT EXPORTER
 * Tuân thủ Nghị định 30/2020/NĐ-CP về thể thức văn bản hành chính & kinh tế
 * Phông chữ chuẩn 100%: Times New Roman
 */

export function exportToWordDocument({
  title = 'BÁO CÁO KẾT QUẢ KIỂM TRA HỒ SƠ CHUYÊN MÔN',
  subTitle = '',
  department = 'HỆ THỐNG TRÍ TUỆ NHÂN TẠO TRÍ AI',
  code = '01/BC-TRIAI',
  sections = [],
  approverName = 'QUANG NHỰT TRÍ',
  approverTitle = 'CHỦ SỞ HỮU & GIÁM ĐỐC ĐIỀU HÀNH',
  fileName = 'Tai_lieu_TriAI.doc'
}) {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const year = currentDate.getFullYear();

  let bodyHtml = '';

  sections.forEach((sec) => {
    if (sec.heading) {
      bodyHtml += `
        <p style="font-family: 'Times New Roman', serif; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 14pt; margin-bottom: 4pt; color: #000000;">
          ${sec.heading}
        </p>
      `;
    }

    if (sec.items && sec.items.length > 0) {
      sec.items.forEach((it) => {
        bodyHtml += `
          <p style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; margin: 0 0 4pt 0; text-align: justify; text-indent: 1.27cm;">
            - ${it}
          </p>
        `;
      });
    }

    if (sec.table) {
      bodyHtml += `
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: 'Times New Roman', serif; font-size: 12pt; margin: 8pt 0 12pt 0; border: 1px solid #000000;">
          <thead>
            <tr style="background-color: #f2f4f8; font-weight: bold; text-align: center;">
      `;
      sec.table.headers.forEach((h) => {
        bodyHtml += `<th style="padding: 7px 8px; border: 1px solid #000000;">${h}</th>`;
      });
      bodyHtml += `
            </tr>
          </thead>
          <tbody>
      `;
      sec.table.rows.forEach((r, rIdx) => {
        bodyHtml += `<tr style="${rIdx % 2 === 1 ? 'background-color: #fafbfc;' : ''}">`;
        r.forEach((cell, cIdx) => {
          const align = cIdx === 0 ? 'center' : cIdx === 1 ? 'left' : 'center';
          bodyHtml += `<td style="padding: 6px 8px; border: 1px solid #000000; text-align: ${align};">${cell}</td>`;
        });
        bodyHtml += `</tr>`;
      });
      bodyHtml += `
          </tbody>
        </table>
      `;
    }
  });

  const fullWordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 56.7pt 56.7pt 56.7pt 70.85pt; /* Top: 2cm, Right: 2cm, Bottom: 2cm, Left: 2.5cm */
      mso-header-margin: 36pt;
      mso-footer-margin: 36pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.35;
      color: #000000;
      background-color: #ffffff;
    }
    p { margin: 0 0 6pt 0; text-align: justify; font-family: 'Times New Roman', Times, serif; }
    .header-table { width: 100%; border: none; margin-bottom: 14pt; }
    .header-table td { border: none; vertical-align: top; padding: 0; }
    .title-doc {
      font-family: 'Times New Roman', Times, serif;
      font-size: 15pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin: 18pt 0 4pt 0;
      color: #000000;
    }
    .subtitle-doc {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-style: italic;
      text-align: center;
      margin-bottom: 16pt;
      color: #333333;
    }
    .sign-table { width: 100%; border: none; margin-top: 22pt; }
    .sign-table td { border: none; vertical-align: top; padding: 0; }
  </style>
</head>
<body>
  <div class="Section1">
    <!-- HEADER HÀNH CHÍNH CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP -->
    <table class="header-table">
      <tr>
        <td style="width: 44%; text-align: center;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">${department}</div>
          <div style="font-size: 11pt; font-weight: bold; color: #1c68e8; margin-top: 2pt;">NỀN TẢNG TRÍ AI ENTERPRISE</div>
          <div style="font-size: 11pt; margin-top: 4pt;">Số: <strong>${code}</strong></div>
        </td>
        <td style="width: 56%; text-align: center;">
          <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style="font-size: 13pt; font-weight: bold; margin-top: 1pt;">Độc lập - Tự do - Hạnh phúc</div>
          <div style="font-size: 11pt; letter-spacing: -1px; margin-top: -3pt;">-----------------------</div>
          <div style="font-size: 12pt; font-style: italic; margin-top: 4pt;">Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}</div>
        </td>
      </tr>
    </table>

    <!-- TIÊU ĐỀ VĂN BẢN -->
    <div class="title-doc">${title}</div>
    ${subTitle ? `<div class="subtitle-doc">${subTitle}</div>` : ''}

    <!-- NỘI DUNG VĂN BẢN -->
    ${bodyHtml}

    <!-- CHỮ KÝ VÀ PHÊ DUYỆT -->
    <table class="sign-table">
      <tr>
        <td style="width: 44%;">
          <div style="font-weight: bold; font-style: italic; font-size: 12pt;">Nơi nhận:</div>
          <div style="font-size: 11pt; line-height: 1.3;">
            - Ban Giám Đốc TRÍ AI;<br/>
            - Khách hàng & Đối tác;<br/>
            - Các bộ phận liên quan;<br/>
            - Lưu: VT, Hồ sơ số TRÍ AI.
          </div>
        </td>
        <td style="width: 56%; text-align: center;">
          <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">NGƯỜI PHÊ DUYỆT / MASTER ADMIN</div>
          <div style="font-size: 11pt; font-style: italic; color: #555555; margin-top: 2pt;">(Ký số điện tử và đóng dấu xác thực)</div>
          <br/><br/><br/>
          <div style="font-weight: bold; font-size: 14pt; color: #1c68e8; text-transform: uppercase;">${approverName}</div>
          <div style="font-size: 11pt; font-weight: bold; color: #10b981; margin-top: 2pt;">[ĐÃ KÝ DUYỆT BẰNG CHỮ KÝ SỐ TRÍ AI]</div>
          <div style="font-size: 10.5pt; color: #666666;">Email: triqnnamabank@gmail.com</div>
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
  a.download = fileName.endsWith('.doc') || fileName.endsWith('.docx') ? fileName : `${fileName}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default exportToWordDocument;
