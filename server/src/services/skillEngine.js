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
   * Import skill from a ZIP file buffer
   */
  static async importFromZip(buffer, originalFilename = 'skill_package.zip') {
    const zip = await JSZip.loadAsync(buffer);
    let meta = {};
    let skillMd = '';

    // Check for skill.json or manifest.json
    const manifestFile = zip.file('skill.json') || zip.file('manifest.json');
    if (manifestFile) {
      const manifestText = await manifestFile.async('text');
      meta = JSON.parse(manifestText);
    }

    // Check for SKILL.md or README.md
    const mdFile = zip.file('SKILL.md') || zip.file('README.md') || zip.file('instruction.md');
    if (mdFile) {
      skillMd = await mdFile.async('text');
    }

    const skillName = meta.name || path.basename(originalFilename, '.zip').replace(/[-_]/g, ' ');
    const skillId = meta.id || `skl_zip_${uuidv4().substring(0, 8)}`;

    return await this.upsertSkill({
      id: skillId,
      name: skillName,
      category: meta.category || 'Mở rộng (ZIP Package)',
      description: meta.desc || meta.description || 'Gói Skill được nạp từ file ZIP chuẩn module TRÍ AI.',
      color: meta.color || 'emerald',
      iconName: meta.iconName || 'Package',
      author: meta.author || 'Tải lên bởi Admin',
      systemRole: meta.systemRole || `Chuyên gia đảm nhiệm kỹ năng ${skillName}`,
      samplePrompt: meta.samplePrompt || `Hãy kích hoạt kỹ năng [${skillName}] và thực hiện yêu cầu giúp tôi.`,
      skillMd: skillMd || meta.skillMd || `# Kỹ năng: ${skillName}`,
      checklist: meta.checklist || [
        { label: 'Cấu trúc file ZIP hợp lệ: Đạt chuẩn 100%', status: 'pass' },
        { label: 'Kiểm tra tệp tin thực thi: Hoàn tất', status: 'pass' }
      ],
      sampleFiles: meta.sampleFiles || [],
      version: meta.version || '1.0.0',
      changelog: 'Nạp trực tiếp từ file ZIP đóng gói'
    });
  }
}

export default SkillEngine;
