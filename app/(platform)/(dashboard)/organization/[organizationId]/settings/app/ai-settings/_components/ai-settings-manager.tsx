"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReviewSkill = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  enabled: boolean;
  order: number;
};

type ReviewPartner = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

type AiSettingsManagerProps = {
  orgId: string;
  initialSkills: ReviewSkill[];
  initialPartners: ReviewPartner[];
};

type Tab = "skills" | "partners";

export const AiSettingsManager = ({ orgId, initialSkills, initialPartners }: AiSettingsManagerProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("skills");
  const [skills, setSkills] = useState<ReviewSkill[]>(initialSkills);
  const [partners, setPartners] = useState<ReviewPartner[]>(initialPartners);
  const [seeding, setSeeding] = useState(false);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/review-skills/seed`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast.success(json.message ?? "Skills loaded");
      const list = await fetch(`/api/organizations/${orgId}/review-skills`);
      const listJson = await list.json();
      if (listJson.data) setSkills(listJson.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load defaults");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-[#333]">
        {(["skills", "partners"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-2 text-sm font-medium text-[#888] hover:text-[#e5e5e5] border-b-2 border-transparent -mb-px capitalize",
              activeTab === tab && "text-violet-400 border-violet-500"
            )}
          >
            {tab === "skills" ? `Skills (${skills.length})` : `Partners (${partners.length})`}
          </button>
        ))}
      </div>

      {activeTab === "skills" && (
        <SkillsTab
          orgId={orgId}
          skills={skills}
          setSkills={setSkills}
          seeding={seeding}
          onSeedDefaults={handleSeedDefaults}
        />
      )}

      {activeTab === "partners" && (
        <PartnersTab
          orgId={orgId}
          partners={partners}
          setPartners={setPartners}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skills tab
// ---------------------------------------------------------------------------

type SkillsTabProps = {
  orgId: string;
  skills: ReviewSkill[];
  setSkills: (s: ReviewSkill[]) => void;
  seeding: boolean;
  onSeedDefaults: () => void;
};

type SkillForm = { name: string; description: string; prompt: string; enabled: boolean };
const EMPTY_SKILL: SkillForm = { name: "", description: "", prompt: "", enabled: true };

const SkillsTab = ({ orgId, skills, setSkills, seeding, onSeedDefaults }: SkillsTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SkillForm>(EMPTY_SKILL);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_SKILL);
    setShowForm(true);
  };

  const startEdit = (skill: ReviewSkill) => {
    setEditingId(skill.id);
    setForm({ name: skill.name, description: skill.description, prompt: skill.prompt, enabled: skill.enabled });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_SKILL);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.prompt.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/organizations/${orgId}/review-skills/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setSkills(skills.map((s) => (s.id === editingId ? json.data : s)));
        toast.success("Skill updated");
      } else {
        const res = await fetch(`/api/organizations/${orgId}/review-skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setSkills([...skills, json.data]);
        toast.success("Skill created");
      }
      cancelForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save skill");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (skill: ReviewSkill) => {
    const updated = { ...skill, enabled: !skill.enabled };
    setSkills(skills.map((s) => (s.id === skill.id ? updated : s)));
    try {
      await fetch(`/api/organizations/${orgId}/review-skills/${skill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: updated.enabled }),
      });
    } catch {
      setSkills(skills.map((s) => (s.id === skill.id ? skill : s)));
      toast.error("Failed to update skill");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/organizations/${orgId}/review-skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSkills(skills.filter((s) => s.id !== id));
      toast.success("Skill deleted");
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#666]">
          Claude picks the best skill automatically based on file content.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSeedDefaults}
            disabled={seeding}
            className="text-xs gap-1"
          >
            {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Load defaults
          </Button>
          <Button size="sm" onClick={startCreate} className="text-xs gap-1">
            <Plus className="h-3 w-3" />
            Add skill
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-md border border-[#333] p-4 space-y-3 bg-[#1a1a1a]">
          <h3 className="text-sm font-medium">{editingId ? "Edit skill" : "New skill"}</h3>
          <div className="space-y-2">
            <label className="text-xs text-[#888]">Name (slug)</label>
            <input
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              placeholder="e.g. business-brief-review"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#888]">Description (shown to Claude when choosing a skill)</label>
            <input
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500"
              placeholder="One-line description of what this skill reviews"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#888]">Prompt (full skill instructions)</label>
            <textarea
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500 resize-y min-h-[200px] font-mono"
              placeholder="You are a senior... ## Checklist..."
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skill-enabled"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="accent-violet-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="skill-enabled" className="text-xs text-[#888] cursor-pointer">Enabled</label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={cancelForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      {skills.length === 0 && !showForm && (
        <p className="text-sm text-[#666] py-4 text-center">
          No skills yet. Click &ldquo;Load defaults&rdquo; to add the 17 built-in review skills, or add your own.
        </p>
      )}

      <div className="space-y-2">
        {skills.map((skill) => (
          <div key={skill.id} className={cn("rounded-md border border-[#333] bg-[#1a1a1a]", !skill.enabled && "opacity-50")}>
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={skill.enabled}
                onChange={() => handleToggleEnabled(skill)}
                className="accent-violet-500 w-4 h-4 cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e5e5e5] truncate">{skill.name}</p>
                <p className="text-xs text-[#666] truncate">{skill.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#666] hover:text-[#e5e5e5]"
                  onClick={() => toggleExpand(skill.id)}
                >
                  {expandedIds.has(skill.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#666] hover:text-[#e5e5e5]"
                  onClick={() => startEdit(skill)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#666] hover:text-red-400"
                  onClick={() => handleDelete(skill.id)}
                  disabled={deletingId === skill.id}
                >
                  {deletingId === skill.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            {expandedIds.has(skill.id) && (
              <div className="px-4 pb-3 border-t border-[#333] pt-3">
                <pre className="text-xs text-[#aaa] whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">{skill.prompt}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Partners tab
// ---------------------------------------------------------------------------

type PartnersTabProps = {
  orgId: string;
  partners: ReviewPartner[];
  setPartners: (p: ReviewPartner[]) => void;
};

type PartnerForm = { name: string; slug: string; context: string };
const EMPTY_PARTNER: PartnerForm = { name: "", slug: "", context: "" };

const PartnersTab = ({ orgId, partners, setPartners }: PartnersTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(EMPTY_PARTNER);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toSlug = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PARTNER);
    setShowForm(true);
  };

  const startEdit = async (partner: ReviewPartner) => {
    setEditingId(partner.id);
    try {
      const res = await fetch(`/api/organizations/${orgId}/review-partners/${partner.id}`);
      const json = await res.json();
      setForm({ name: json.data.name, slug: json.data.slug, context: json.data.context });
    } catch {
      setForm({ name: partner.name, slug: partner.slug, context: "" });
    }
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_PARTNER);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.context.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/organizations/${orgId}/review-partners/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setPartners(partners.map((p) => (p.id === editingId ? { ...p, name: json.data.name, slug: json.data.slug } : p)));
        toast.success("Partner updated");
      } else {
        const res = await fetch(`/api/organizations/${orgId}/review-partners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        setPartners([...partners, json.data]);
        toast.success("Partner created");
      }
      cancelForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save partner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/organizations/${orgId}/review-partners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setPartners(partners.filter((p) => p.id !== id));
      toast.success("Partner deleted");
    } catch {
      toast.error("Failed to delete partner");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#666]">
          Partner knowledge is applied when a reviewer selects a partner on the attachment.
        </p>
        <Button size="sm" onClick={startCreate} className="text-xs gap-1">
          <Plus className="h-3 w-3" />
          Add partner
        </Button>
      </div>

      {showForm && (
        <div className="rounded-md border border-[#333] p-4 space-y-3 bg-[#1a1a1a]">
          <h3 className="text-sm font-medium">{editingId ? "Edit partner" : "New partner"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-[#888]">Name</label>
              <input
                className="w-full bg-[#111] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500"
                placeholder="e.g. Acme Corp"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: editingId ? f.slug : toSlug(name) }));
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#888]">Slug (used in reviewer dropdown)</label>
              <input
                className="w-full bg-[#111] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500"
                placeholder="e.g. acme-corp"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#888]">Context (pain points, style preferences, background)</label>
            <textarea
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none focus:border-violet-500 resize-y min-h-[150px]"
              placeholder="Client background, pain points, preferred communication style, design preferences..."
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={cancelForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      {partners.length === 0 && !showForm && (
        <p className="text-sm text-[#666] py-4 text-center">
          No partners yet. Add one to enable partner-specific AI context in reviews.
        </p>
      )}

      <div className="space-y-2">
        {partners.map((partner) => (
          <div key={partner.id} className="rounded-md border border-[#333] bg-[#1a1a1a]">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e5e5e5]">{partner.name}</p>
                <p className="text-xs text-[#666]">slug: {partner.slug}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#666] hover:text-[#e5e5e5]"
                  onClick={() => toggleExpand(partner.id)}
                >
                  {expandedIds.has(partner.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#666] hover:text-[#e5e5e5]"
                  onClick={() => startEdit(partner)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#666] hover:text-red-400"
                  onClick={() => handleDelete(partner.id)}
                  disabled={deletingId === partner.id}
                >
                  {deletingId === partner.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            {expandedIds.has(partner.id) && (
              <div className="px-4 pb-3 border-t border-[#333] pt-3">
                <PartnerContextPreview orgId={orgId} partnerId={partner.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const PartnerContextPreview = ({ orgId, partnerId }: { orgId: string; partnerId: string }) => {
  const [context, setContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (context !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/review-partners/${partnerId}`);
      const json = await res.json();
      setContext(json.data?.context ?? "");
    } catch {
      setContext("Failed to load context.");
    } finally {
      setLoading(false);
    }
  };

  if (!context && !loading) {
    void load();
  }

  return loading ? (
    <Loader2 className="h-4 w-4 animate-spin text-[#666]" />
  ) : (
    <pre className="text-xs text-[#aaa] whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">{context}</pre>
  );
};
