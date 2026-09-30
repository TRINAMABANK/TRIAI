import db from '../db/index.js';

export class AgentEngine {
  static async getAllAgents(onlyActive = true) {
    const query = onlyActive
      ? 'SELECT * FROM agents WHERE is_active = 1 ORDER BY created_at ASC'
      : 'SELECT * FROM agents ORDER BY created_at ASC';
    const rows = await db.all(query);

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      role: r.role,
      avatar: r.avatar_url,
      avatarUrl: r.avatar_url,
      bio: r.bio,
      greeting: r.greeting,
      specialties: r.specialties_json ? JSON.parse(r.specialties_json) : [],
      modelConfig: r.model_config_json ? JSON.parse(r.model_config_json) : {},
      isActive: Boolean(r.is_active),
      status: 'Sẵn sàng hỗ trợ'
    }));
  }

  static async getAgentById(id) {
    const r = await db.get('SELECT * FROM agents WHERE id = ? OR slug = ?', [id, id]);
    if (!r) return null;

    // Get bound skills
    const boundSkills = await db.all(
      `SELECT s.* FROM skills s
       INNER JOIN agent_skills ask ON s.id = ask.skill_id
       WHERE ask.agent_id = ?`,
      [r.id]
    );

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      role: r.role,
      avatar: r.avatar_url,
      avatarUrl: r.avatar_url,
      bio: r.bio,
      greeting: r.greeting,
      specialties: r.specialties_json ? JSON.parse(r.specialties_json) : [],
      modelConfig: r.model_config_json ? JSON.parse(r.model_config_json) : {},
      isActive: Boolean(r.is_active),
      skills: boundSkills
    };
  }

  static async upsertAgent({ id, name, role, avatarUrl, bio, greeting, specialties = [], modelConfig = {}, isActive = 1 }) {
    const now = new Date().toISOString();
    const agentId = id || `agt_${Date.now()}`;
    const slug = agentId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const existing = await db.get('SELECT id FROM agents WHERE id = ?', [agentId]);
    if (existing) {
      await db.run(
        `UPDATE agents SET name = ?, role = ?, avatar_url = ?, bio = ?, greeting = ?, specialties_json = ?, model_config_json = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
        [name, role, avatarUrl, bio, greeting, JSON.stringify(specialties), JSON.stringify(modelConfig), isActive ? 1 : 0, now, agentId]
      );
    } else {
      await db.run(
        `INSERT INTO agents (id, slug, name, role, avatar_url, bio, greeting, specialties_json, model_config_json, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [agentId, slug, name, role, avatarUrl, bio, greeting, JSON.stringify(specialties), JSON.stringify(modelConfig), isActive ? 1 : 0, now, now]
      );
    }

    return this.getAgentById(agentId);
  }
}

export default AgentEngine;
