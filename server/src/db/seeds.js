import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './index.js';
import { hashPassword } from '../utils/security.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSeeds() {
  const now = new Date().toISOString();

  // 1. Seed Master Admin User (triqnnamabank@gmail.com)
  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [env.ADMIN_EMAIL]);
  if (!existingAdmin) {
    const adminPasswordHash = await hashPassword(env.ADMIN_INITIAL_PASSWORD);
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, plan, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        'usr_master_admin',
        env.ADMIN_EMAIL,
        adminPasswordHash,
        'TRÍ AI Master Admin (Quang Nhựt Trí)',
        '/assets/user_avatar.png',
        'owner',
        'Gói Quản Trị Hệ Thống (Master)',
        now,
        now
      ]
    );
    console.log(`✅ Seeded Master Admin: ${env.ADMIN_EMAIL}`);
  }

  // 2. Seed Agents from agentsData.js (or JSON fallback)
  const agentsCount = await db.get('SELECT COUNT(*) as count FROM agents');
  if (agentsCount.count === 0) {
    const agents = [
      {
        id: 'tro-ly-kol',
        slug: 'tro-ly-kol',
        name: 'Trợ lý KOL & Visual AI (Ý Ngọc Studio)',
        role: 'Giám đốc Sáng tạo & Visual Campaign',
        avatar_url: '/assets/y_ngoc_aodai.jpg',
        bio: 'Chuyên gia chỉ đạo nghệ thuật & Visual AI Campaign. Đảm bảo khóa nhận diện gương mặt người mẫu Ý Ngọc 100% trong mọi bối cảnh và trang phục cao cấp.',
        greeting: 'Chào anh! Em là Trợ lý KOL & Visual AI của Studio Ý Ngọc. Em đã sẵn sàng khởi tạo các bộ ảnh Lookbook 8K, khóa nhận diện nhân vật và xuất bản tài liệu chiến dịch cho anh.',
        specialties: ['Lookbook 8K', 'Khóa nhận diện gương mặt', 'Fashion Campaign', 'Phong cách Áo dài & Haute Couture']
      },
      {
        id: 'anh-an',
        slug: 'anh-an',
        name: 'Trợ lý Kỹ sư M&E / PCCC',
        role: 'Kỹ sư trưởng & Trợ lý tham mưu',
        avatar_url: '/assets/agent_an.png',
        bio: '15 năm kinh nghiệm quản lý dự án xây dựng và cơ điện công trình cấp I. Hỗ trợ rà soát hiện trường và tham mưu kỹ thuật trực tiếp cho lãnh đạo.',
        greeting: 'Chào anh, tôi là Trợ lý Kỹ sư M&E. Tôi có thể hỗ trợ anh kiểm tra kỹ thuật công trình, soát lỗi hồ sơ thi công hoặc giám sát nghiệm thu.',
        specialties: ['Giám sát thi công', 'Hệ thống MEP', 'Nghiệm thu PCCC', 'Thẩm tra bản vẽ']
      },
      {
        id: 'tro-ly-mua-sam',
        slug: 'tro-ly-mua-sam',
        name: 'Trợ lý Mua sắm',
        role: 'So sánh báo giá, đánh giá NCC',
        avatar_url: '/assets/agent_muasam.png',
        bio: 'Chuyên gia procurement với cơ sở dữ liệu hơn 1.200 nhà cung cấp thiết bị kỹ thuật, vật tư công trình và dịch vụ tòa nhà.',
        greeting: 'Em chào anh! Anh gửi các bảng báo giá hoặc danh mục vật tư cần mua sắm, em sẽ bóc tách và phân tích so sánh ngay cho anh.',
        specialties: ['Bóc tách báo giá', 'Đánh giá năng lực NCC', 'Lập tờ trình mua sắm', 'Đàm phán thương thảo']
      },
      {
        id: 'tro-ly-phap-ly',
        slug: 'tro-ly-phap-ly',
        name: 'Trợ lý Pháp lý',
        role: 'Soạn thảo, kiểm tra văn bản',
        avatar_url: '/assets/agent_phaply.png',
        bio: 'Cố vấn pháp chế chuyên sâu về hợp đồng kinh tế, thủ tục cấp phép xây dựng và an toàn PCCC theo quy định hiện hành.',
        greeting: 'Chào anh! Em đã sẵn sàng rà soát hợp đồng, kiểm tra tính pháp lý của hồ sơ hoặc soạn thảo các văn bản tờ trình cho anh.',
        specialties: ['Rà soát hợp đồng EPC/Thi công', 'Căn cứ luật PCCC & Xây dựng', 'Cảnh báo rủi ro pháp lý', 'Biên bản thỏa thuận']
      },
      {
        id: 'tro-ly-tai-chinh',
        slug: 'tro-ly-tai-chinh',
        name: 'Trợ lý Tài chính',
        role: 'Phân tích chi phí & báo cáo',
        avatar_url: '/assets/agent_taichinh.png',
        bio: 'Chuyên gia tài chính dự án, xây dựng mô hình dự toán chi phí vận hành và lập báo cáo quản trị chuyên sâu cho doanh nghiệp.',
        greeting: 'Chào anh! Tôi có thể giúp anh thẩm định dự toán chi phí, phân tích dòng tiền và lập kế hoạch tối ưu ngân sách dự án.',
        specialties: ['Dự toán ngân sách', 'Phân tích dòng tiền CAPEX/OPEX', 'Thẩm định tài chính', 'Tối ưu thuế & Chi phí']
      }
    ];

    for (const agent of agents) {
      await db.run(
        `INSERT INTO agents (id, slug, name, role, avatar_url, bio, greeting, specialties_json, model_config_json, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          agent.id,
          agent.slug,
          agent.name,
          agent.role,
          agent.avatar_url,
          agent.bio,
          agent.greeting,
          JSON.stringify(agent.specialties),
          JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 2048 }),
          now,
          now
        ]
      );
    }
    console.log(`✅ Seeded ${agents.length} default Agents.`);
  }

  // 3. Seed Master Skills from src/data/masterSkills.json
  const skillsCount = await db.get('SELECT COUNT(*) as count FROM skills');
  if (skillsCount.count === 0) {
    const masterSkillsPath = path.resolve(__dirname, '../../../src/data/masterSkills.json');
    if (fs.existsSync(masterSkillsPath)) {
      const skillsData = JSON.parse(fs.readFileSync(masterSkillsPath, 'utf8'));
      for (const skill of skillsData) {
        const skillId = skill.id || `skl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await db.run(
          `INSERT INTO skills (id, slug, name, category, description, color, price_month, price_year, icon_name, author, status, current_version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', '1.0.0', ?, ?)`,
          [
            skillId,
            skill.id || skillId,
            skill.name || 'Skill không tên',
            skill.category || 'Chung',
            skill.desc || skill.description || '',
            skill.color || 'blue',
            skill.price || '199.000đ/tháng',
            '1.990.000đ/năm',
            skill.iconName || 'Sparkles',
            'TRÍ AI Master',
            now,
            now
          ]
        );

        // Seed Skill Version 1.0.0
        const versionId = `ver_${skillId}_1.0.0`;
        await db.run(
          `INSERT INTO skill_versions (id, skill_id, version, changelog, system_role, sample_prompt, skill_md, checklist_json, sample_files_json, parameters_schema_json, is_active, created_at)
           VALUES (?, ?, '1.0.0', 'Phiên bản khởi tạo hệ thống TRÍ AI', ?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            versionId,
            skillId,
            skill.systemRole || `Chuyên gia cấp cao về ${skill.name}`,
            skill.samplePrompt || '',
            skill.skillMd || '',
            JSON.stringify(skill.checklist || []),
            JSON.stringify(skill.sampleFiles || []),
            JSON.stringify({}),
            now
          ]
        );
      }
      console.log(`✅ Seeded ${skillsData.length} Master Skills & Versions.`);
    }
  }

  // 4. Grant All Master Skills to Admin by default
  const adminUser = await db.get('SELECT id FROM users WHERE email = ?', [env.ADMIN_EMAIL]);
  if (adminUser) {
    const allSkills = await db.all('SELECT id FROM skills');
    for (const sk of allSkills) {
      const existingLicense = await db.get(
        'SELECT id FROM licenses WHERE user_id = ? AND skill_id = ?',
        [adminUser.id, sk.id]
      );
      if (!existingLicense) {
        await db.run(
          `INSERT INTO licenses (id, user_id, skill_id, license_key, license_type, status, expires_at, granted_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'permanent', 'active', NULL, 'system', ?, ?)`,
          [
            `lic_admin_${sk.id}`,
            adminUser.id,
            sk.id,
            `LIC-MASTER-${sk.id.toUpperCase()}`,
            now,
            now
          ]
        );
      }
    }
    console.log(`✅ Granted master licenses to Admin (${env.ADMIN_EMAIL}).`);
  }
}

export default runSeeds;
