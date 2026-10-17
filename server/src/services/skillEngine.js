import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import db from '../db/index.js';

export class SkillEngine {
  /**
   * Get all published or accessible skills with latest version info
   */
  static async getAllSkills(status = 'published') {
    const query = status === 'all'
      ? `SELECT s.*, sv.system_role, sv.sample_prompt, sv.skill_md, sv.checklist_json, sv.sample_files_json
         FROM skills s
         LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND s.current_version = sv.version
         ORDER BY s.created_at ASC`
      : `SELECT s.*, sv.system_role, sv.sample_prompt, sv.skill_md, sv.checklist_json, sv.sample_files_json
         FROM skills s
         LEFT JOIN skill_versions sv ON s.id = sv.skill_id AND s.current_version = sv.version
         WHERE s.status = ?
         ORDER BY s.created_at ASC`;

    const params = status === 'all' ? [] : [status];
    const rows = await db.all(query, params);

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      desc: r.description,
      description: r.description,
      color: r.color,
      price: r.price_month,
      priceMonth: r.price_month,
      priceYear: r.price_year,
      iconName: r.icon_name,
      author: r.author,
      status: r.status,
      version: r.current_version,
      systemRole: r.system_role,
      samplePrompt: r.sample_prompt,
      skillMd: r.skill_md,
      checklist: r.checklist_json ? JSON.parse(r.checklist_json) : [],
      sampleFiles: r.sample_files_json ? JSON.parse(r.sample_files_json) : []
    }));
  }

  /**
   * Get single skill by ID with full version details
   */
  static async getSkillById(id) {
    const skill = await db.get('SELECT * FROM skills WHERE id = ? OR slug = ?', [id, id]);
    if (!skill) return null;

    const version = await db.get(
      'SELECT * FROM skill_versions WHERE skill_id = ? AND version = ?',
      [skill.id, skill.current_version]
    );

    const allVersions = await db.all(
      'SELECT id, version, changelog, created_at FROM skill_versions WHERE skill_id = ? ORDER BY created_at DESC',
      [skill.id]
    );

    return {
      ...skill,
      systemRole: version?.system_role,
      samplePrompt: version?.sample_prompt,
      skillMd: version?.skill_md,
      checklist: version?.checklist_json ? JSON.parse(version.checklist_json) : [],
      sampleFiles: version?.sample_files_json ? JSON.parse(version.sample_files_json) : [],
      versionHistory: allVersions
    };
  }

  /**
   * Create or update a skill with a new version
   */
  static async upsertSkill({
    id,
    name,
    category,
    description,
    color = 'blue',
    priceMonth = '199.000đ/tháng',
    priceYear = '1.990.000đ/năm',
    iconName = 'Sparkles',
    author = 'TRÍ AI Master',
    systemRole,
    samplePrompt,
    skillMd,
    checklist = [],
    sampleFiles = [],
    version = '1.0.0',
    changelog = 'Cập nhật nội dung'
  }) {
    const now = new Date().toISOString();
    const skillId = id || `skl_${uuidv4().substring(0, 8)}`;
    const slug = skillId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const existing = await db.get('SELECT * FROM skills WHERE id = ?', [skillId]);

    if (existing) {
      await db.run(
        `UPDATE skills SET name = ?, category = ?, description = ?, color = ?, price_month = ?, price_year = ?, icon_name = ?, current_version = ?, updated_at = ?
         WHERE id = ?`,
        [name, category, description, color, priceMonth, priceYear, iconName, version, now, skillId]
      );
    } else {
      await db.run(
        `INSERT INTO skills (id, slug, name, category, description, color, price_month, price_year, icon_name, author, status, current_version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
        [skillId, slug, name, category, description, color, priceMonth, priceYear, iconName, author, version, now, now]
      );
    }

    // Insert new version
    const versionId = `ver_${skillId}_${version.replace(/\./g, '_')}`;
    const existingVer = await db.get('SELECT id FROM skill_versions WHERE id = ?', [versionId]);

    if (existingVer) {
      await db.run(
        `UPDATE skill_versions SET changelog = ?, system_role = ?, sample_prompt = ?, skill_md = ?, checklist_json = ?, sample_files_json = ?
         WHERE id = ?`,
        [changelog, systemRole, samplePrompt, skillMd, JSON.stringify(checklist), JSON.stringify(sampleFiles), versionId]
      );
    } else {
      await db.run(
        `INSERT INTO skill_versions (id, skill_id, version, changelog, system_role, sample_prompt, skill_md, checklist_json, sample_files_json, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [versionId, skillId, version, changelog, systemRole, samplePrompt, skillMd, JSON.stringify(checklist), JSON.stringify(sampleFiles), now]
      );
    }

    return this.getSkillById(skillId);
  }

  /**
   * Import skill from a ZIP file buffer with strict security checks:
   * - Magic bytes validation
   * - Path traversal prevention
   * - Zip Bomb limits (file count, total uncompressed size, single file size)
   * - Dangerous executable and nested archive blocking
   * - Sanitized manifest and markdown parsing with zero arbitrary code execution
   */
  static async importFromZip(buffer, originalFilename = 'skill_package.zip') {
    // 1. Magic bytes validation (PK header)
    if (!buffer || buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
      throw new Error('Tệp tin không phải là gói ZIP hợp lệ (Invalid ZIP magic bytes).');
    }

    let zip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (err) {
      throw new Error('Tệp tin ZIP bị hỏng hoặc cấu trúc nén không hợp lệ: ' + err.message);
    }

    const MAX_ZIP_FILES = 100;
    const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_TOTAL_UNCOMPRESSED_SIZE = 30 * 1024 * 1024; // 30MB

    const entries = Object.values(zip.files);
    if (entries.length > MAX_ZIP_FILES) {
      throw new Error(`Gói ZIP chứa quá nhiều tệp tin (${entries.length} > ${MAX_ZIP_FILES}). Bị từ chối để chống tấn công cạn kiệt tài nguyên.`);
    }

    const DANGEROUS_EXTS = new Set([
      '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
      '.php', '.phtml', '.py', '.pyc', '.rb', '.pl', '.cgi', '.jar', '.bin', '.dll', '.so', '.msi'
    ]);

    const NESTED_ARCHIVE_EXTS = new Set(['.zip', '.tar', '.gz', '.tgz', '.rar', '.7z', '.bz2']);

    let totalUncompressedSize = 0;

    // 2. Scan every entry for Path Traversal, dangerous files & zip bomb
    for (const entry of entries) {
      const rawName = entry.name;
      const normalizedPath = rawName.replace(/\\/g, '/');

      // Check Path Traversal
      if (
        normalizedPath.includes('../') ||
        normalizedPath.includes('/..') ||
        normalizedPath === '..' ||
        normalizedPath.startsWith('/') ||
        normalizedPath.startsWith('\\') ||
        /^[a-zA-Z]:/.test(normalizedPath) ||
        normalizedPath.includes('\0')
      ) {
        throw new Error(`Phát hiện đường dẫn không an toàn trong gói ZIP: '${rawName}' (Path Traversal attempt). Quá trình giải nén bị từ chối.`);
      }

      if (entry.dir) continue;

      const ext = path.extname(normalizedPath).toLowerCase();

      // Check dangerous executable files
      if (DANGEROUS_EXTS.has(ext)) {
        throw new Error(`Gói ZIP chứa tệp tin thực thi nguy hiểm: '${rawName}'. Bị từ chối vì lý do an ninh.`);
      }

      // Check nested archives
      if (NESTED_ARCHIVE_EXTS.has(ext)) {
        throw new Error(`Gói ZIP chứa tệp tin nén lồng nhau: '${rawName}'. Không được hỗ trợ.`);
      }

      // Check file size limits
      const uncompressedSize = entry._data?.uncompressedSize || 0;
      if (uncompressedSize > MAX_SINGLE_FILE_SIZE) {
        throw new Error(`Tệp tin '${rawName}' vượt quá giới hạn kích thước cho phép (${(uncompressedSize / (1024 * 1024)).toFixed(1)}MB > 10MB).`);
      }

      totalUncompressedSize += uncompressedSize;
      if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_SIZE) {
        throw new Error(`Tổng dung lượng giải nén vượt quá giới hạn an toàn (${(totalUncompressedSize / (1024 * 1024)).toFixed(1)}MB > 30MB). Nghi ngờ Zip Bomb.`);
      }
    }

    let meta = {};
    let skillMd = '';

    // 3. Check for skill.json or manifest.json
    const manifestFile = zip.file('skill.json') || zip.file('manifest.json');
    if (manifestFile) {
      try {
        const manifestText = await manifestFile.async('text');
        meta = JSON.parse(manifestText);
      } catch (err) {
        throw new Error('Tệp cấu hình manifest.json / skill.json trong gói ZIP không đúng định dạng JSON hợp lệ.');
      }
    }

    // 4. Check for SKILL.md or README.md
    const mdFile = zip.file('SKILL.md') || zip.file('README.md') || zip.file('instruction.md');
    if (mdFile) {
      skillMd = await mdFile.async('text');
      // Limit markdown size to 1MB
      if (skillMd.length > 1024 * 1024) {
        skillMd = skillMd.substring(0, 1024 * 1024);
      }
    }

    // Helper to sanitize text fields and strip HTML
    const sanitizeText = (str, maxLen = 200) => {
      if (!str || typeof str !== 'string') return '';
      return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLen);
    };

    const rawSkillName = meta.name || path.basename(originalFilename, '.zip').replace(/[-_]/g, ' ');
    const skillName = sanitizeText(rawSkillName, 100) || 'Kỹ năng mới';

    // Validate or generate clean skill ID
    let skillId = meta.id && typeof meta.id === 'string' ? meta.id.trim() : null;
    if (!skillId || !/^[a-zA-Z0-9_-]{3,64}$/.test(skillId)) {
      skillId = `skl_zip_${uuidv4().substring(0, 8)}`;
    }

    return await this.upsertSkill({
      id: skillId,
      name: skillName,
      category: sanitizeText(meta.category, 50) || 'Mở rộng (ZIP Package)',
      description: sanitizeText(meta.desc || meta.description, 500) || 'Gói Skill được nạp từ file ZIP chuẩn module TRÍ AI.',
      color: sanitizeText(meta.color, 20) || 'emerald',
      iconName: sanitizeText(meta.iconName, 30) || 'Package',
      author: sanitizeText(meta.author, 50) || 'Tải lên bởi Admin',
      systemRole: sanitizeText(meta.systemRole, 1000) || `Chuyên gia đảm nhiệm kỹ năng ${skillName}`,
      samplePrompt: sanitizeText(meta.samplePrompt, 500) || `Hãy kích hoạt kỹ năng [${skillName}] và thực hiện yêu cầu giúp tôi.`,
      skillMd: skillMd || meta.skillMd || `# Kỹ năng: ${skillName}`,
      checklist: Array.isArray(meta.checklist) ? meta.checklist : [
        { label: 'Cấu trúc file ZIP hợp lệ: Đạt chuẩn 100%', status: 'pass' },
        { label: 'Kiểm tra tệp tin thực thi: An toàn 100%', status: 'pass' }
      ],
      sampleFiles: Array.isArray(meta.sampleFiles) ? meta.sampleFiles : [],
      version: sanitizeText(meta.version, 20) || '1.0.0',
      changelog: 'Nạp trực tiếp từ file ZIP đóng gói an toàn'
    });
  }
}

export default SkillEngine;
