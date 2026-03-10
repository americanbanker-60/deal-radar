import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";

export default function AddContactDialog({ open, onOpenChange, target }) {
  const [form, setForm] = useState({
    first_name: target?.contactFirstName || "",
    last_name: target?.contactLastName || "",
    email: target?.contactEmail || "",
    title: target?.contactTitle || "",
    linkedin: target?.linkedin || "",
    is_primary: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!target?.id) {
      setError("Target ID is missing.");
      return;
    }
    if (!form.first_name && !form.email) {
      setError("Please provide at least a first name or email.");
      return;
    }

    setSaving(true);
    setError(null);

    await base44.entities.Contact.create({
      target_id: target.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      linkedin: form.linkedin.trim(),
      is_primary: form.is_primary,
    });

    setSaved(true);
    setSaving(false);

    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        title: "",
        linkedin: "",
        is_primary: true,
      });
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Add Contact
          </DialogTitle>
          <DialogDescription>
            Save a contact for <strong>{target?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input
                value={form.first_name}
                onChange={e => handleChange("first_name", e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input
                value={form.last_name}
                onChange={e => handleChange("last_name", e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => handleChange("email", e.target.value)}
              placeholder="jane@company.com"
            />
          </div>

          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={e => handleChange("title", e.target.value)}
              placeholder="CEO / Owner"
            />
          </div>

          <div className="space-y-1">
            <Label>LinkedIn URL</Label>
            <Input
              value={form.linkedin}
              onChange={e => handleChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_primary"
              checked={form.is_primary}
              onCheckedChange={val => handleChange("is_primary", val)}
            />
            <Label htmlFor="is_primary" className="cursor-pointer text-sm">
              Mark as primary contact
            </Label>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className={saved ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : saved ? (
              "Saved!"
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" />Save Contact</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}